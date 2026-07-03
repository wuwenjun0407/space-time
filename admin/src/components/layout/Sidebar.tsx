"use client";

import { api, tokenStore } from "@/lib/api";
import type { UserMe } from "@/types";
import {
	theme as antdTheme,
	ConfigProvider,
	Form,
	Input,
	message,
	Modal,
} from "antd";
import {
	Camera,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ImageIcon,
	KeyRound,
	LayoutDashboard,
	LogOut,
	Palette,
	Pencil,
	ScrollText,
	Settings,
	ShieldCheck,
	Sparkles,
	Telescope,
	Upload,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavItem = {
	key: string;
	label: string;
	icon: React.ReactNode;
	group?: string;
};

const NAV_ALL: NavItem[] = [
	{
		key: "/upload",
		label: "影像上传",
		icon: <Upload size={16} />,
		group: "我的工作台",
	},
	{
		key: "/my-spaces",
		label: "我的空间",
		icon: <Sparkles size={16} />,
		group: "我的工作台",
	},
];

const NAV_OWNER: NavItem[] = [
	{
		key: "/dashboard",
		label: "概览总览",
		icon: <LayoutDashboard size={16} />,
		group: "群组管理",
	},
	{
		key: "/group",
		label: "群组成员",
		icon: <Users size={16} />,
		group: "群组管理",
	},
	{
		key: "/media",
		label: "影像管理",
		icon: <ImageIcon size={16} />,
		group: "群组管理",
	},
	{
		key: "/styles",
		label: "素材主题",
		icon: <Palette size={16} />,
		group: "群组管理",
	},
	{
		key: "/logs",
		label: "操作日志",
		icon: <ScrollText size={16} />,
		group: "群组管理",
	},
];

const NAV_SUPERADMIN: NavItem[] = [
	{
		key: "/users",
		label: "用户管理",
		icon: <ShieldCheck size={16} />,
		group: "超管专区",
	},
	{
		key: "/settings",
		label: "系统设置",
		icon: <Settings size={16} />,
		group: "超管专区",
	},
];

interface SidebarProps {
	me: UserMe;
	onMeUpdate?: (me: UserMe) => void;
}

export default function Sidebar({ me, onMeUpdate }: SidebarProps) {
	const router = useRouter();
	const path = usePathname();
	const [collapsed, setCollapsed] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [nicknameModal, setNicknameModal] = useState(false);
	const [pwdModal, setPwdModal] = useState(false);
	const [form] = Form.useForm();
	const [pwdForm] = Form.useForm();
	const [saving, setSaving] = useState(false);
	const profileRef = useRef<HTMLDivElement>(null);

	// 从 localStorage 恢复折叠状态
	useEffect(() => {
		const saved = localStorage.getItem("st_sidebar_collapsed");
		if (saved === "true") setCollapsed(true);
	}, []);

	const toggleCollapsed = () => {
		const next = !collapsed;
		setCollapsed(next);
		localStorage.setItem("st_sidebar_collapsed", String(next));
	};

	const handleLogout = () => {
		tokenStore.clear();
		router.replace("/login");
	};

	const saveNickname = async () => {
		setSaving(true);
		try {
			const values = await form.validateFields();
			await api.patch("/me", { nickname: values.nickname });
			message.success("昵称已更新");
			setNicknameModal(false);
			if (onMeUpdate) onMeUpdate({ ...me, nickname: values.nickname });
		} catch (e: unknown) {
			const err = e as { message?: string };
			if (err?.message) message.error(err.message);
		} finally {
			setSaving(false);
		}
	};

	const savePassword = async () => {
		setSaving(true);
		try {
			const values = await pwdForm.validateFields();
			if (values.new_password !== values.confirm_password) {
				message.error("两次密码不一致");
				return;
			}
			await api.post("/auth/change-password", {
				old_password: values.old_password,
				new_password: values.new_password,
			});
			message.success("密码已修改，请重新登录");
			setPwdModal(false);
			setTimeout(() => {
				tokenStore.clear();
				router.replace("/login");
			}, 1200);
		} catch (e: unknown) {
			const err = e as { message?: string };
			if (err?.message) message.error(err.message);
		} finally {
			setSaving(false);
		}
	};

	// 点击外部关闭 profile 浮层
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				profileRef.current &&
				!profileRef.current.contains(e.target as Node)
			) {
				setProfileOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// 按权限构建导航
	const navItems =
		me.role === "superadmin"
			? [...NAV_ALL, ...NAV_OWNER, ...NAV_SUPERADMIN]
			: [...NAV_ALL, ...NAV_OWNER];

	// 分组
	const groups = Array.from(new Set(navItems.map((i) => i.group)));

	const isActive = (key: string) =>
		path === key || (key !== "/" && path.startsWith(key + "/"));

	const avatarLetter =
		(me.nickname?.[0] || me.username[0])?.toUpperCase() ?? "U";

	return (
		<>
			<aside
				className="st-sidebar-transition relative flex flex-col shrink-0 overflow-hidden"
				style={{
					width: collapsed ? 68 : 240,
					minHeight: "100vh",
					background: "#ffffff",
					borderRight: "1px solid rgba(124,58,237,0.1)",
					boxShadow: "4px 0 28px rgba(109,40,217,0.07)",
				}}
			>
				{/* ── Logo ── */}
				<div
					style={{
						borderBottom: "1px solid rgba(124,58,237,0.08)",
						padding: collapsed ? "18px 0" : "18px 20px",
						display: "flex",
						alignItems: "center",
						gap: 10,
						justifyContent: collapsed ? "center" : "flex-start",
					}}
				>
					{/* Logo 图标 */}
					<div
						style={{
							width: 34,
							height: 34,
							borderRadius: 10,
							background: "linear-gradient(135deg,#7c3aed 0%,#6366f1 100%)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
							flexShrink: 0,
						}}
					>
						<Telescope size={17} color="#fff" />
					</div>
					{!collapsed && (
						<div>
							<p
								style={{
									margin: 0,
									fontSize: 15,
									fontWeight: 700,
									background: "linear-gradient(135deg,#7c3aed,#6366f1)",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
									backgroundClip: "text",
									letterSpacing: 1,
									lineHeight: 1.2,
								}}
							>
								时空万象
							</p>
							<p
								style={{
									margin: 0,
									fontSize: 10,
									color: "#a78bfa",
									letterSpacing: 0.5,
									lineHeight: 1.2,
								}}
							>
								管理控制台
							</p>
						</div>
					)}
				</div>

				{/* ── 导航 ── */}
				<nav
					style={{
						flex: 1,
						overflowY: "auto",
						padding: "10px 8px",
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					{groups.map((group) => (
						<div key={group}>
							{/* 分组标签 */}
							{!collapsed && (
								<p
									style={{
										margin: "10px 8px 4px",
										fontSize: 10,
										fontWeight: 600,
										color: "#c4b5fd",
										letterSpacing: 1,
										textTransform: "uppercase",
									}}
								>
									{group}
								</p>
							)}
							{collapsed && (
								<div
									style={{
										height: 1,
										background: "rgba(124,58,237,0.08)",
										margin: "6px 8px",
									}}
								/>
							)}

							{navItems
								.filter((item) => item.group === group)
								.map((item) => (
									<Link
										key={item.key}
										href={item.key}
										title={collapsed ? item.label : undefined}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 10,
											padding: collapsed ? "10px 0" : "9px 12px",
											borderRadius: 10,
											fontSize: 13,
											fontWeight: isActive(item.key) ? 600 : 400,
											color: isActive(item.key) ? "#7c3aed" : "#6b7280",
											background: isActive(item.key)
												? "linear-gradient(90deg,rgba(124,58,237,0.1) 0%,rgba(99,102,241,0.05) 100%)"
												: "transparent",
											textDecoration: "none",
											transition: "all 0.18s ease",
											justifyContent: collapsed ? "center" : "flex-start",
											position: "relative",
											marginBottom: 1,
										}}
										onMouseEnter={(e) => {
											if (!isActive(item.key)) {
												(e.currentTarget as HTMLElement).style.background =
													"rgba(124,58,237,0.06)";
												(e.currentTarget as HTMLElement).style.color =
													"#7c3aed";
											}
										}}
										onMouseLeave={(e) => {
											if (!isActive(item.key)) {
												(e.currentTarget as HTMLElement).style.background =
													"transparent";
												(e.currentTarget as HTMLElement).style.color =
													"#6b7280";
											}
										}}
									>
										{/* 激活左侧指示条 */}
										{isActive(item.key) && !collapsed && (
											<span
												style={{
													position: "absolute",
													left: 0,
													top: "50%",
													transform: "translateY(-50%)",
													width: 3,
													height: 18,
													background: "linear-gradient(180deg,#7c3aed,#6366f1)",
													borderRadius: "0 3px 3px 0",
												}}
											/>
										)}
										<span
											style={{
												color: isActive(item.key) ? "#7c3aed" : "#9ca3af",
												display: "flex",
												alignItems: "center",
											}}
										>
											{item.icon}
										</span>
										{!collapsed && (
											<span style={{ flex: 1 }}>{item.label}</span>
										)}
									</Link>
								))}
						</div>
					))}
				</nav>

				{/* ── 用户区域 ── */}
				<div
					ref={profileRef}
					style={{
						padding: "8px",
						borderTop: "1px solid rgba(124,58,237,0.08)",
						position: "relative",
					}}
				>
					{/* Profile 浮层菜单 */}
					{profileOpen && (
						<div
							className="st-slide-up"
							style={{
								position: "absolute",
								bottom: "calc(100% + 6px)",
								left: 8,
								right: 8,
								background: "#ffffff",
								borderRadius: 12,
								border: "1px solid rgba(124,58,237,0.12)",
								boxShadow: "0 8px 32px rgba(109,40,217,0.14)",
								overflow: "hidden",
								zIndex: 100,
								minWidth: 160,
							}}
						>
							{/* 用户信息顶部 */}
							<div
								style={{
									padding: "12px 14px",
									background:
										"linear-gradient(135deg,rgba(124,58,237,0.06),rgba(99,102,241,0.04))",
									borderBottom: "1px solid rgba(124,58,237,0.08)",
								}}
							>
								<p
									style={{
										margin: 0,
										fontSize: 13,
										fontWeight: 600,
										color: "#1e1b4b",
									}}
								>
									{me.nickname || me.username}
								</p>
								<p style={{ margin: 0, fontSize: 11, color: "#8b83b4" }}>
									@{me.username}
								</p>
							</div>

							<MenuBtn
								icon={<Pencil size={13} />}
								label="编辑昵称"
								onClick={() => {
									form.setFieldsValue({ nickname: me.nickname });
									setNicknameModal(true);
									setProfileOpen(false);
								}}
							/>
							<MenuBtn
								icon={<Camera size={13} />}
								label="更换头像"
								onClick={() => {
									message.info("头像上传功能开发中");
									setProfileOpen(false);
								}}
							/>
							<MenuBtn
								icon={<KeyRound size={13} />}
								label="修改密码"
								onClick={() => {
									setPwdModal(true);
									setProfileOpen(false);
								}}
							/>
							<div style={{ borderTop: "1px solid rgba(124,58,237,0.08)" }} />
							<MenuBtn
								icon={<LogOut size={13} />}
								label="退出登录"
								danger
								onClick={handleLogout}
							/>
						</div>
					)}

					{/* Profile 按钮 */}
					<button
						onClick={() => setProfileOpen(!profileOpen)}
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: collapsed ? "8px 0" : "8px 10px",
							borderRadius: 10,
							background: profileOpen ? "rgba(124,58,237,0.07)" : "transparent",
							border: "none",
							cursor: "pointer",
							justifyContent: collapsed ? "center" : "flex-start",
							transition: "background 0.18s ease",
						}}
						onMouseEnter={(e) => {
							if (!profileOpen)
								(e.currentTarget as HTMLElement).style.background =
									"rgba(124,58,237,0.05)";
						}}
						onMouseLeave={(e) => {
							if (!profileOpen)
								(e.currentTarget as HTMLElement).style.background =
									"transparent";
						}}
					>
						{/* 头像 */}
						<div
							style={{
								width: 32,
								height: 32,
								borderRadius: 10,
								background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 13,
								fontWeight: 700,
								color: "#fff",
								flexShrink: 0,
								boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
								overflow: "hidden",
							}}
						>
							{me.avatar_url ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={me.avatar_url}
									alt="avatar"
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							) : (
								avatarLetter
							)}
						</div>

						{!collapsed && (
							<>
								<div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
									<p
										style={{
											margin: 0,
											fontSize: 12,
											fontWeight: 600,
											color: "#1e1b4b",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{me.nickname || me.username}
									</p>
									<p
										style={{
											margin: 0,
											fontSize: 10,
											color: "#8b83b4",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{me.role === "superadmin" ? "超级管理员" : "普通成员"}
									</p>
								</div>
								<ChevronUp
									size={13}
									color="#c4b5fd"
									style={{
										transition: "transform 0.2s ease",
										transform: profileOpen ? "rotate(0deg)" : "rotate(180deg)",
										flexShrink: 0,
									}}
								/>
							</>
						)}
					</button>
				</div>

				{/* ── 折叠切换按钮 ── */}
				<button
					onClick={toggleCollapsed}
					title={collapsed ? "展开侧边栏" : "收起侧边栏"}
					style={{
						position: "absolute",
						right: -13,
						top: 28,
						width: 26,
						height: 26,
						borderRadius: "50%",
						background: "#ffffff",
						border: "1px solid rgba(124,58,237,0.15)",
						boxShadow: "0 2px 8px rgba(109,40,217,0.12)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						zIndex: 10,
						transition: "all 0.18s ease",
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.background =
							"linear-gradient(135deg,#ede9fe,#e0e7ff)";
						(e.currentTarget as HTMLElement).style.borderColor =
							"rgba(124,58,237,0.35)";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.background = "#ffffff";
						(e.currentTarget as HTMLElement).style.borderColor =
							"rgba(124,58,237,0.15)";
					}}
				>
					{collapsed ? (
						<ChevronRight size={12} color="#7c3aed" />
					) : (
						<ChevronLeft size={12} color="#7c3aed" />
					)}
				</button>
			</aside>

			{/* ── 昵称编辑 Modal ── */}
			<ConfigProvider
				theme={{
					algorithm: antdTheme.defaultAlgorithm,
					token: { colorPrimary: "#7c3aed", borderRadius: 10 },
				}}
			>
				<Modal
					title="编辑昵称"
					open={nicknameModal}
					onOk={saveNickname}
					onCancel={() => setNicknameModal(false)}
					confirmLoading={saving}
					okText="保存"
					cancelText="取消"
					destroyOnClose
				>
					<Form
						form={form}
						layout="vertical"
						initialValues={{ nickname: me.nickname }}
						style={{ marginTop: 16 }}
					>
						<Form.Item
							name="nickname"
							label="昵称"
							rules={[
								{ required: true, message: "请输入昵称" },
								{ max: 30, message: "昵称最多 30 个字符" },
								{ min: 1, message: "昵称不能为空" },
							]}
						>
							<Input placeholder="请输入新昵称" maxLength={30} showCount />
						</Form.Item>
						<p style={{ fontSize: 12, color: "#8b83b4", margin: 0 }}>
							昵称将在管理后台和 APP 中展示，用户名 @{me.username} 不可修改。
						</p>
					</Form>
				</Modal>

				{/* ── 修改密码 Modal ── */}
				<Modal
					title="修改密码"
					open={pwdModal}
					onOk={savePassword}
					onCancel={() => {
						setPwdModal(false);
						pwdForm.resetFields();
					}}
					confirmLoading={saving}
					okText="确认修改"
					cancelText="取消"
					destroyOnClose
				>
					<Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
						<Form.Item
							name="old_password"
							label="当前密码"
							rules={[{ required: true, message: "请输入当前密码" }]}
						>
							<Input.Password placeholder="请输入当前密码" />
						</Form.Item>
						<Form.Item
							name="new_password"
							label="新密码"
							rules={[
								{ required: true, message: "请输入新密码" },
								{ min: 8, message: "密码至少 8 位" },
								{ max: 32, message: "密码最多 32 位" },
								{
									pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
									message: "密码需包含字母和数字",
								},
							]}
						>
							<Input.Password placeholder="8~32位，须含字母和数字" />
						</Form.Item>
						<Form.Item
							name="confirm_password"
							label="确认新密码"
							rules={[{ required: true, message: "请再次输入新密码" }]}
						>
							<Input.Password placeholder="再次输入新密码" />
						</Form.Item>
					</Form>
				</Modal>
			</ConfigProvider>
		</>
	);
}

/* ── 浮层菜单按钮 ── */
function MenuBtn({
	icon,
	label,
	danger,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	danger?: boolean;
	onClick: () => void;
}) {
	const [hovered, setHovered] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				width: "100%",
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "9px 14px",
				background: hovered
					? danger
						? "rgba(239,68,68,0.06)"
						: "rgba(124,58,237,0.06)"
					: "transparent",
				border: "none",
				cursor: "pointer",
				fontSize: 13,
				color: danger
					? hovered
						? "#ef4444"
						: "#f87171"
					: hovered
						? "#7c3aed"
						: "#4c4571",
				transition: "all 0.15s ease",
				textAlign: "left",
			}}
		>
			{icon}
			{label}
		</button>
	);
}
