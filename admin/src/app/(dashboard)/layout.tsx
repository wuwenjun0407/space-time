"use client";
import { api, tokenStore } from "@/lib/api";
import type { UserMe } from "@/types";
import { Avatar, Dropdown, Layout, Menu, Spin } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Sider, Header, Content } = Layout;

const ALL = [
	{ key: "/upload", label: "影像上传" },
	{ key: "/my-spaces", label: "我的空间" },
];
const OWNER = [
	{ key: "/dashboard", label: "概览" },
	{ key: "/group", label: "成员管理" },
	{ key: "/media", label: "影像管理" },
	{ key: "/styles", label: "皮肤配置" },
	{ key: "/logs", label: "操作日志" },
];
const ADMIN = [
	{ key: "/users", label: "用户管理" },
	{ key: "/settings", label: "系统设置" },
];

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

	if (!me) return <Spin style={{ display: "block", marginTop: "40vh" }} />;

	const items = [
		...ALL,
		...(me.role === "superadmin" ? [...OWNER, ...ADMIN] : OWNER),
	];

	return (
		<Layout style={{ minHeight: "100vh" }}>
			<Sider theme="dark" width={200}>
				<div
					style={{
						color: "#6C63FF",
						fontWeight: 700,
						padding: 20,
						fontSize: 16,
					}}
				>
					时空万象
				</div>
				<Menu
					theme="dark"
					mode="inline"
					selectedKeys={[path]}
					items={items}
					onClick={(e) => router.push(e.key)}
				/>
			</Sider>
			<Layout>
				<Header
					style={{
						display: "flex",
						justifyContent: "flex-end",
						alignItems: "center",
						paddingRight: 24,
					}}
				>
					<Dropdown
						menu={{
							items: [
								{
									key: "logout",
									label: "退出登录",
									onClick: () => {
										tokenStore.clear();
										router.replace("/login");
									},
								},
							],
						}}
					>
						<span style={{ cursor: "pointer", color: "#fff" }}>
							<Avatar size="small">{me.nickname?.[0] || "U"}</Avatar>{" "}
							{me.nickname}
						</span>
					</Dropdown>
				</Header>
				<Content style={{ margin: 24 }}>{children}</Content>
			</Layout>
		</Layout>
	);
}
