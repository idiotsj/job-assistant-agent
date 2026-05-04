"use client";

import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { formatUserFacingError } from "@/lib/errors";
import { useAuthSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/features/auth/auth-shell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

export function LoginPage() {
  const router = useRouter();
  const { markLoggedIn, status, user } = useAuthSession();

  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Password123!");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextEmail = params.get("email");
    const registered = params.get("registered");

    if (nextEmail) {
      setEmail(nextEmail);
    }

    if (registered) {
      setMessage("注册成功了，现在登录即可进入工作台。");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setMessage("");

    try {
      const nextUser = await login({ email, password });

      startTransition(() => {
        markLoggedIn(nextUser);
        setMessage("登录成功，正在带你进入画像页。");
      });

      router.push("/profile");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage("邮箱或密码不正确，请再检查一次。");
      } else {
        setErrorMessage(formatUserFacingError(error, "登录没有成功，请稍后再试。"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "authenticated" && user) {
    return (
      <AuthShell
        title="你已经登录"
        description="当前账号已经处于有效登录状态，可以继续完善画像或直接回到首页。"
        footer={
          <>
            <Link href="/profile" className="wa-button wa-button--primary wa-button--md">
              去画像页
            </Link>
            <Link href="/" className="wa-button wa-button--secondary wa-button--md">
              回首页
            </Link>
          </>
        }
      >
        <div className="message-strip message-strip--success">
          当前登录账号：{user.name ?? user.email}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="登录 Work Agent"
      description="登录后即可接入岗位推荐、画像、简历诊断和岗位定向分析。"
      footer={
        <>
          <span className="small-copy">还没有账号？</span>
          <Link href="/register" className="text-link">
            去注册
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="message-strip">
          演示账号：`demo@example.com` / `Password123!`
        </div>
        {message ? <div className="message-strip message-strip--success">{message}</div> : null}
        {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}

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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <Button size="lg" type="submit" loading={submitting}>
          登录并进入工作台
        </Button>
      </form>
    </AuthShell>
  );
}
