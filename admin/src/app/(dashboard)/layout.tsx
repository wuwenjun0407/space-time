"use client";
import Sidebar from "@/components/layout/Sidebar";
import { api, tokenStore } from "@/lib/api";
import type { UserMe } from "@/types";
import { ConfigProvider, theme as antdTheme } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 路由 → 页面标题映射
const PAGE_TITLES: Record<string, { title: string; desc?: string }> = {
	"/dashboard": { title: "概览总览", desc: "群组数据一览无余" },
	"/upload": { title: "影像上传", desc: "上传照片与视频到群组" },
	"/my-spaces": { title: "我的空间", desc: "创建与管理你的策展展览" },
	"/group": { title: "群组成员", desc: "管理群组成员与群组信息" },
	"/media": { title: "影像管理", desc: "浏览与管理群组内所有影像" },
	"/styles": { title: "素材主题", desc: "配置皮肤风格与主题氛围包" },
	"/logs": { title: "操作日志", desc: "查看群组内所有操作记录" },
	"/users": { title: "用户管理", desc: "超级管理员专属：管理全平台用户" },
	"/settings": { title: "系统设置", desc: "配置平台全局参数" },
};

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const path = usePathname();
	const [me, setMe] = useState<UserMe>();

	useEffect(() => {
		if (!tokenStore.get()) {
			router.replace("/login");
			return;
		}
		api
			.get("/me")
			.then((u) => setMe(u as unknown as UserMe))
			.catch(() => router.replace("/login"));
	}, [router]);

	// 加载中骨架
	if (!me) {
		return (
			<div
				className="st-light-mode st-dash-bg"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<div
						style={{
							width: 42,
							height: 42,
							borderRadius: "50%",
							border: "3px solid rgba(124,58,237,0.15)",
							borderTopColor: "#7c3aed",
							animation: "st-spin 0.8s linear infinite",
							margin: "0 auto 12px",
						}}
					/>
					<p style={{ color: "#a78bfa", fontSize: 13, margin: 0 }}>
						正在加载时空万象…
					</p>
				</div>
			</div>
		);
	}

	// 计算当前页面的标题信息
	const pageInfo = Object.entries(PAGE_TITLES).find(
		([key]) => path === key || path.startsWith(key + "/"),
	)?.[1] ?? { title: "时空万象", desc: "管理控制台" };

	return (
		<ConfigProvider
			theme={{
				algorithm: antdTheme.defaultAlgorithm,
				token: {
					colorPrimary: "#7c3aed",
					colorLink: "#7c3aed",
					borderRadius: 10,
					colorBgContainer: "#ffffff",
					colorBgElevated: "#ffffff",
					colorText: "#1e1b4b",
					colorTextSecondary: "#6b7280",
					colorBorder: "rgba(124,58,237,0.15)",
					colorBorderSecondary: "rgba(124,58,237,0.08)",
					fontFamily:
						"'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
				},
			}}
		>
			<div
				className="st-light-mode"
				style={{ display: "flex", height: "100vh", overflow: "hidden" }}
			>
				{/* 侧边栏 */}
				<Sidebar me={me} onMeUpdate={(updated) => setMe(updated)} />

				{/* 主区域 */}
				<div
					className="st-dash-bg"
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						minWidth: 0,
						overflow: "hidden",
					}}
				>
					{/* 顶部页面标题栏 */}
					<div
						style={{
							padding: "16px 28px 12px",
							borderBottom: "1px solid rgba(124,58,237,0.07)",
							background: "rgba(255,255,255,0.6)",
							backdropFilter: "blur(8px)",
							flexShrink: 0,
						}}
					>
						<h1
							style={{
								margin: 0,
								fontSize: 18,
								fontWeight: 700,
								color: "#1e1b4b",
								lineHeight: 1.3,
							}}
						>
							{pageInfo.title}
						</h1>
						{pageInfo.desc && (
							<p
								style={{
									margin: "2px 0 0",
									fontSize: 12,
									color: "#8b83b4",
								}}
							>
								{pageInfo.desc}
							</p>
						)}
					</div>

					{/* 页面内容 */}
					<main
						style={{
							flex: 1,
							overflowY: "auto",
							padding: "24px 28px",
						}}
					>
						{children}
					</main>
				</div>
			</div>
		</ConfigProvider>
	);
}
