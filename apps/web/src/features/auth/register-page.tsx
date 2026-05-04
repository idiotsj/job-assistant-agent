"use client";

import { register } from "@/lib/api/auth";
import { formatUserFacingError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/features/auth/auth-shell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("林嘉言");
  const [email, setEmail] = useState("demo+new@example.com");
  const [password, setPassword] = useState("Password123!");
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setMessage("");

    try {
      await register({ name, email, password });
      setMessage("注册完成，正在跳转到登录页。");
      router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
    } catch (error) {
      setErrorMessage(formatUserFacingError(error, "注册没有成功，请稍后再试。"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="创建账号"
      description="先建立账号和基础画像，再进入岗位推荐和 AI 简历能力。"
      footer={
        <>
          <span className="small-copy">已经有账号了？</span>
          <Link href="/login" className="text-link">
            去登录
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {message ? <div className="message-strip message-strip--success">{message}</div> : null}
        {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

        <label className="field-group">
          <span className="field-label">姓名</span>
          <Input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="field-group">
          <span className="field-label">邮箱</span>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="field-group">
          <span className="field-label">密码</span>
          <Input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <span className="field-help">至少 8 位，包含大写字母、小写字母和数字。</span>
        </label>

        <Button size="lg" type="submit" loading={submitting}>
          注册账号
        </Button>
      </form>
    </AuthShell>
  );
}
