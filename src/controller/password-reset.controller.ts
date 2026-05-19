import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Header,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { Request } from "express";
import { PasswordResetService } from "src/service";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
} from "src/dto";
import { ApiKeyGuard } from "src/guard";

@ApiTags("auth")
@Controller("auth/password-reset")
export class PasswordResetController {
  private readonly logger = new Logger(PasswordResetController.name);

  constructor(private readonly passwordResetService: PasswordResetService) {}

  /**
   * Request a password reset
   * @param dto - Request data with login_id or email and ip_address
   * @returns Password reset response message
   */
  @Post("request")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "パスワードリセットをリクエスト",
    description:
      "ログインID またはメールアドレスを指定してパスワードリセットのメールを送信します。リクエスト内容はログイン履歴に記録されます。",
  })
  @ApiResponse({
    status: 200,
    description: "パスワードリセットメールが送信されました",
    type: PasswordResetResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 404, description: "ユーザーが見つかりません" })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.requestPasswordReset(dto);
  }

  /**
   * Confirm a password reset (JSON API, requires API key)
   * @param dto - Reset data with token, new_password, and ip_address
   * @returns Password reset response message
   */
  @Post("confirm")
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity("X-API-Key")
  @ApiOperation({
    summary: "パスワードをリセット (API)",
    description:
      "パスワードリセットトークンと新しいパスワードを指定してパスワードを変更します。変更内容はログイン履歴に記録されます。ユーザーがブロックされている場合は解消されます。",
  })
  @ApiResponse({
    status: 200,
    description: "パスワードが正常に変更されました",
    type: PasswordResetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "トークンが無効または期限切れ、もしくは新しいパスワードが現在または以前のパスワードと同じです",
  })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  async confirmPasswordReset(
    @Body() dto: ResetPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.confirmPasswordReset(dto);
  }

  /**
   * Render the browser-accessible password-change form.
   * Linked from the password-reset email; requires no API key.
   * @param token - Password reset token from query string
   * @returns HTML form page
   */
  @Get("resetPassword")
  @Header("Content-Type", "text/html; charset=utf-8")
  @ApiExcludeEndpoint()
  getPasswordResetForm(@Query("token") token: string): string {
    if (!token || token.trim() === "") {
      return this.buildErrorPage(
        "リンクが無効です",
        "パスワードリセットのリンクが無効または期限切れです。もう一度リクエストしてください。",
      );
    }
    return this.buildFormPage(token);
  }

  /**
   * Process the browser form submission.
   * Reads the client IP from request headers; requires no API key.
   * @param token - Password reset token (from form body)
   * @param newPassword - New password (from form body)
   * @param req - Express request (used to extract client IP)
   * @returns HTML result page (success or error)
   */
  @Post("resetPassword")
  @Header("Content-Type", "text/html; charset=utf-8")
  @ApiExcludeEndpoint()
  async submitPasswordResetForm(
    @Body("token") token: string,
    @Body("new_password") newPassword: string,
    @Req() req: Request,
  ): Promise<string> {
    const ipAddress = this.extractIp(req);

    const dto: ResetPasswordDto = {
      token: token || "",
      new_password: newPassword || "",
      ip_address: ipAddress,
    };

    try {
      await this.passwordResetService.confirmPasswordReset(dto);
      return this.buildSuccessPage();
    } catch (err: unknown) {
      this.logger.error("Error during password reset form submission:", err);
      const userMessage =
        "パスワードのリセットに失敗しました。時間をおいて再度お試しください。";
      return this.buildErrorPage("パスワード変更エラー", userMessage);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Extract the client IP from the request, preferring X-Forwarded-For. */
  private extractIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return raw?.split(",")[0]?.trim() || req.socket?.remoteAddress || "0.0.0.0";
  }

  /** Escape special HTML characters to prevent injection. */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return text.replace(/[&<>"']/g, (ch) => map[ch]);
  }

  /** Render the password-change form page. */
  private buildFormPage(token: string): string {
    const escapedToken = this.escapeHtml(token);
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>パスワード変更</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f5f5f5; color: #333; margin: 0; padding: 40px 16px; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { font-size: 1.4rem; margin: 0 0 8px; }
    p.subtitle { color: #666; font-size: .9rem; margin: 0 0 28px; }
    label { display: block; font-size: .9rem; font-weight: bold; margin-bottom: 4px; }
    input[type=password] { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; margin-bottom: 20px; }
    input[type=password]:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,.15); }
    .hint { font-size: .8rem; color: #888; margin-top: -16px; margin-bottom: 20px; }
    .error-msg { color: #dc3545; font-size: .85rem; margin-bottom: 16px; display: none; }
    button[type=submit] { width: 100%; padding: 12px; background: #007bff; color: #fff; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
    button[type=submit]:hover { background: #0056b3; }
    button[type=submit]:disabled { background: #6c757d; cursor: default; }
  </style>
</head>
<body>
  <div class="card">
    <h1>パスワード変更</h1>
    <p class="subtitle">新しいパスワードを入力してください。</p>
    <div id="formError" class="error-msg"></div>
    <form id="resetForm" action="/auth/password-reset/resetPassword" method="POST" novalidate>
      <input type="hidden" name="token" value="${escapedToken}">
      <label for="new_password">新しいパスワード</label>
      <input type="password" id="new_password" name="new_password"
             placeholder="8文字以上" autocomplete="new-password" required minlength="8">
      <p class="hint">半角英数字・記号を含む8文字以上で設定してください。</p>
      <label for="confirm_password">パスワード（確認）</label>
      <input type="password" id="confirm_password" name="confirm_password"
             placeholder="もう一度入力してください" autocomplete="new-password" required>
      <button type="submit" id="submitBtn">パスワードを変更する</button>
    </form>
  </div>
  <script>
    const form = document.getElementById('resetForm');
    const errorBox = document.getElementById('formError');
    const submitBtn = document.getElementById('submitBtn');
    const showError = (msg) => {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    };
    const hideError = () => { errorBox.style.display = 'none'; };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      hideError();
      const pw = document.getElementById('new_password').value;
      const conf = document.getElementById('confirm_password').value;
      if (pw.length < 8) { return showError('パスワードは8文字以上で入力してください。'); }
      if (pw !== conf) { return showError('パスワードが一致しません。'); }
      submitBtn.disabled = true;
      submitBtn.textContent = '変更中...';
      form.submit();
    });
  </script>
</body>
</html>`;
  }

  /** Render the success page after a successful password reset. */
  private buildSuccessPage(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>パスワード変更完了</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f5f5f5; color: #333; margin: 0; padding: 40px 16px; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,.1); text-align: center; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h1 { font-size: 1.4rem; margin: 0 0 12px; }
    p { color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>パスワード変更完了</h1>
    <p>パスワードが正常に変更されました。<br>新しいパスワードでログインしてください。</p>
  </div>
</body>
</html>`;
  }

  /** Render a generic error page with a title and message. */
  private buildErrorPage(title: string, message: string): string {
    const escapedTitle = this.escapeHtml(title);
    const escapedMessage = this.escapeHtml(message);
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f5f5f5; color: #333; margin: 0; padding: 40px 16px; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,.1); text-align: center; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h1 { font-size: 1.4rem; margin: 0 0 12px; color: #dc3545; }
    p { color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>${escapedTitle}</h1>
    <p>${escapedMessage}</p>
  </div>
</body>
</html>`;
  }
}
