"use client";
import { api, tokenStore } from "@/lib/api";
import {
	theme as antdTheme,
	Button,
	Checkbox,
	ConfigProvider,
	Form,
	Input,
	message,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Mascots from "../_components/Mascots";

export default function LoginPage() {
	const [form] = Form.useForm();
	const router = useRouter();
	const [captcha, setCaptcha] = useState<{
		captcha_key: string;
		image: string;
	}>();
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [fieldKey, setFieldKey] = useState<string | null>(null);
	const [mouse, setMouse] = useState({ x: 0, y: 0 });
	const leftRef = useRef<HTMLDivElement>(null);

	useEffect(() => setMounted(true), []);

	const loadCaptcha = async () => {
		try {
			const c = await api.get("/auth/captcha");
			setCaptcha(c as unknown as { captcha_key: string; image: string });
		} catch {
			/* ok */
		}
	};
	useEffect(() => {
		loadCaptcha();
	}, []);

	const onFinish = async (v: {
		username: string;
		password: string;
		captcha_code?: string;
	}) => {
		if (!captcha?.captcha_key) {
			message.error("验证码尚未加载完成，请刷新后重试");
			return;
		}
		setLoading(true);
		try {
			const r: { access_token: string; refresh_token: string } = await api.post(
				"/auth/login",
				{
					...v,
					captcha_code: v.captcha_code?.trim().toUpperCase(),
					captcha_key: captcha?.captcha_key,
				},
			);
			tokenStore.set(r.access_token, r.refresh_token);
			const me: { role: string } = await api.get("/me");
			router.push(me.role === "superadmin" ? "/dashboard" : "/upload");
		} catch (e: any) {
			message.error(e?.message || "登录失败");
			loadCaptcha();
			form.setFieldValue("captcha_code", "");
		} finally {
			setLoading(false);
		}
	};

	const onMouseMove = useCallback((e: React.MouseEvent) => {
		if (!leftRef.current) return;
		const r = leftRef.current.getBoundingClientRect();
		setMouse({
			x: ((e.clientX - r.left) / r.width) * 2 - 1,
			y: ((e.clientY - r.top) / r.height) * 2 - 1,
		});
	}, []);

	if (!mounted) {
		return (
			<div className="st-boot">
				<div className="st-boot-spin" />
				<p className="st-boot-text">时空万象 · 加载中…</p>
			</div>
		);
	}

	return (
		<ConfigProvider
			theme={{
				algorithm: antdTheme.defaultAlgorithm,
				token: { colorPrimary: "#6C5CE7", borderRadius: 9 },
			}}
		>
			<div className="page st-light">
				<div className="shell show">
					{/* ── 左侧 ── */}
					<div className="left" ref={leftRef} onMouseMove={onMouseMove}>
						<div className="left-top">
							<span className="badge">
								<span className="dot" /> 时空万象
							</span>
							<span className="tag">SpaceTime · 珍藏时光</span>
							<h1 className="title">欢迎回来</h1>
							<p className="desc">
								登录时空万象，继续珍藏你与家人的岁月影像，
								<br />
								让每一段时光都有归处。
							</p>
						</div>
						<Mascots fieldKey={fieldKey} mouse={mouse} />
					</div>

					{/* ── 右侧 ── */}
					<div className="right">
						<span className="watermark">SpaceTime</span>
						<span className="s-badge">
							<span className="s-dot" /> 安全登录
						</span>
						<h2 className="r-title">登录</h2>
						<p className="r-sub">请输入账号与密码，进入你的时空。</p>

						<Form
							form={form}
							layout="vertical"
							onFinish={onFinish}
							requiredMark={false}
							size="large"
						>
							<div className="fl">
								<span className="fl-l">账号</span>
								<span className="fl-h">用户名 / 手机</span>
							</div>
							<Form.Item
								name="username"
								rules={[{ required: true, message: "请输入账号" }]}
							>
								<Input
									placeholder="请输入账号"
									autoComplete="username"
									onFocus={() => setFieldKey("username")}
									onBlur={() => setFieldKey(null)}
								/>
							</Form.Item>

							<div className="fl">
								<span className="fl-l">密码</span>
								<span className="fl-h">区分大小写</span>
							</div>
							<Form.Item
								name="password"
								rules={[{ required: true, message: "请输入密码" }]}
							>
								<Input.Password
									placeholder="请输入密码"
									autoComplete="current-password"
									onFocus={() => setFieldKey("password")}
									onBlur={() => setFieldKey(null)}
								/>
							</Form.Item>

							{captcha && (
								<div className="cp-row">
									<Form.Item
										name="captcha_code"
										validateTrigger={[]}
										rules={[
											{ required: true, message: "请输入验证码" },
											{
												len: 4,
												message: "验证码为 4 位字符",
											},
											{
												pattern: /^[A-Za-z0-9]{4}$/,
												message: "验证码仅支持 4 位字母或数字",
											},
										]}
										style={{ flex: 1, marginBottom: 0 }}
									>
										<Input
											placeholder="验证码"
											maxLength={4}
											autoComplete="off"
											onFocus={() => setFieldKey("captcha")}
											onBlur={() => setFieldKey(null)}
											onChange={(e) =>
												form.setFieldValue(
													"captcha_code",
													e.target.value
														.replace(/[^a-zA-Z0-9]/g, "")
														.toUpperCase(),
												)
											}
										/>
									</Form.Item>
									<div
										className="cp-img"
										onClick={loadCaptcha}
										title="点击刷新"
									>
										<img src={captcha.image} alt="captcha" />
									</div>
								</div>
							)}

							<div className="fa">
								<Checkbox>记住我</Checkbox>
								<a href="#" className="fl-link">
									忘记密码?
								</a>
							</div>

							<Button
								type="primary"
								htmlType="submit"
								block
								loading={loading}
								className="l-btn"
							>
								登 录
							</Button>
						</Form>

						<div className="reg">
							还没有账号？<Link href="/register">立即注册</Link>
						</div>
					</div>
				</div>

				<style jsx>{`
					:global(html, body) {
						height: 100%;
						margin: 0;
						background: #e9e9ef !important;
					}
					.page {
						min-height: 100vh;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 32px;
						background: #e9e9ef;
					}
					.shell {
						display: flex;
						width: 100%;
						max-width: 1000px;
						height: 600px;
						background: #fff;
						border-radius: 24px;
						overflow: hidden;
						box-shadow:
							0 30px 80px rgba(0, 0, 0, 0.28),
							0 8px 24px rgba(0, 0, 0, 0.14);
						opacity: 0;
						transform: translateY(18px) scale(0.98);
					}
					.shell.show {
						animation: fu 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
					}
					@keyframes fu {
						to {
							opacity: 1;
							transform: none;
						}
					}
					.left {
						position: relative;
						flex: 1.15;
						min-width: 0;
						overflow: hidden;
						background: linear-gradient(
							160deg,
							#6b6790 0%,
							#565278 45%,
							#454264 100%
						);
						padding: 40px 44px 0;
						display: flex;
						flex-direction: column;
					}
					.left-top {
						position: relative;
						z-index: 2;
					}
					.badge {
						display: inline-flex;
						align-items: center;
						gap: 8px;
						background: rgba(255, 255, 255, 0.14);
						padding: 6px 14px;
						border-radius: 20px;
						color: #fff;
						font-size: 13px;
						font-weight: 700;
					}
					.dot {
						width: 7px;
						height: 7px;
						border-radius: 50%;
						background: #58e08a;
					}
					.tag {
						display: inline-block;
						margin-left: 8px;
						padding: 6px 14px;
						border: 1px solid rgba(255, 255, 255, 0.22);
						border-radius: 20px;
						color: rgba(255, 255, 255, 0.78);
						font-size: 12px;
						background: rgba(255, 255, 255, 0.06);
					}
					.title {
						margin: 26px 0 12px;
						font-size: 34px;
						font-weight: 800;
						color: #fff;
					}
					.desc {
						margin: 0;
						color: rgba(255, 255, 255, 0.62);
						font-size: 13.5px;
						line-height: 1.9;
					}
					.right {
						position: relative;
						width: 400px;
						flex-shrink: 0;
						background: #fff;
						padding: 48px 44px;
						display: flex;
						flex-direction: column;
						justify-content: center;
					}
					.watermark {
						position: absolute;
						top: 34px;
						right: 44px;
						color: #c9c9d4;
						font-size: 15px;
						font-weight: 600;
					}
					.s-badge {
						display: inline-flex;
						align-items: center;
						gap: 6px;
						align-self: flex-start;
						background: #eef0ff;
						color: #6c5ce7;
						padding: 5px 12px;
						border-radius: 8px;
						font-size: 12px;
						font-weight: 700;
						margin-bottom: 20px;
					}
					.s-dot {
						width: 6px;
						height: 6px;
						border-radius: 50%;
						background: #6c5ce7;
					}
					.r-title {
						margin: 0 0 6px;
						font-size: 30px;
						font-weight: 800;
						color: #1c1b2e;
					}
					.r-sub {
						margin: 0 0 26px;
						color: #9a9aa6;
						font-size: 13.5px;
					}
					.fl {
						display: flex;
						justify-content: space-between;
						align-items: baseline;
						margin-bottom: 5px;
					}
					.fl-l {
						font-size: 13px;
						font-weight: 600;
						color: #3a3a46;
					}
					.fl-h {
						font-size: 11px;
						color: #b6b6c0;
					}
					.cp-row {
						display: flex;
						gap: 10px;
						align-items: stretch;
						margin-bottom: 16px;
					}
					.cp-img {
						width: 116px;
						flex: 0 0 116px;
						height: 40px;
						border-radius: 8px;
						overflow: hidden;
						cursor: pointer;
						background: #f5f5f7;
						border: 1px solid #e6e6ec;
					}
					.cp-img img {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}
					.fa {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin: 4px 0 20px;
					}
					.fl-link {
						color: #6c5ce7;
						font-size: 13px;
						text-decoration: none;
					}
					.fl-link:hover {
						text-decoration: underline;
					}
					.l-btn {
						height: 46px;
						font-weight: 700;
						font-size: 15px;
						letter-spacing: 4px;
						border-radius: 10px;
					}
					.reg {
						text-align: center;
						margin-top: 22px;
						color: #9a9aa6;
						font-size: 13px;
					}
					.reg :global(a) {
						color: #6c5ce7;
						text-decoration: none;
						font-weight: 600;
					}
					.reg :global(a:hover) {
						text-decoration: underline;
					}
					:global(.right .ant-form-item) {
						margin-bottom: 15px;
					}
					:global(.right .ant-input),
					:global(.right .ant-input-affix-wrapper) {
						border-radius: 9px;
						background: #fff;
					}
					@media (max-width: 900px) {
						.shell {
							flex-direction: column;
							height: auto;
							max-width: 440px;
						}
						.left {
							min-height: 320px;
							padding-bottom: 20px;
						}
						.right {
							width: 100%;
						}
					}
				`}</style>
			</div>
		</ConfigProvider>
	);
}
