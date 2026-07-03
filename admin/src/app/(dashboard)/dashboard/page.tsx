"use client";

import { api } from "@/lib/api";
import type { Group, MediaFile, Space } from "@/types";
import { Card, Col, Empty, Row, Spin } from "antd";
import {
	Clock,
	ImageIcon,
	Layers,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Stats {
	fileCount: number;
	spaceCount: number;
	memberCount: number;
	groupCount: number;
}

export default function DashboardPage() {
	const [stats, setStats] = useState<Stats>({
		fileCount: 0,
		spaceCount: 0,
		memberCount: 0,
		groupCount: 0,
	});
	const [recentFiles, setRecentFiles] = useState<MediaFile[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			api
				.get("/files?page=1&page_size=8")
				.catch(() => ({ items: [], total: 0 })),
			api
				.get("/spaces?page=1&page_size=100")
				.catch(() => ({ items: [], total: 0 })),
			api.get("/groups").catch(() => []),
		])
			.then(([filesRes, spacesRes, groupsRes]) => {
				const files =
					(filesRes as { items?: MediaFile[]; total?: number }) ?? {};
				const spaces = (spacesRes as { items?: Space[]; total?: number }) ?? {};
				const grps = (groupsRes as Group[]) ?? [];

				setRecentFiles((files.items ?? []) as MediaFile[]);
				setGroups(grps);
				setStats({
					fileCount: files.total ?? 0,
					spaceCount: spaces.total ?? 0,
					memberCount: 0,
					groupCount: grps.length,
				});
			})
			.finally(() => setLoading(false));
	}, []);

	const statCards = [
		{
			label: "影像文件",
			value: stats.fileCount,
			icon: <ImageIcon size={22} color="#fff" />,
			grad: "st-stat-purple",
			sub: "群组内全部文件",
		},
		{
			label: "我的空间",
			value: stats.spaceCount,
			icon: <Sparkles size={22} color="#fff" />,
			grad: "st-stat-amber",
			sub: "已创建的策展展览",
		},
		{
			label: "所在群组",
			value: stats.groupCount,
			icon: <Layers size={22} color="#fff" />,
			grad: "st-stat-cyan",
			sub: "我的群组 + 受邀群组",
		},
		{
			label: "群组成员",
			value: stats.memberCount || "—",
			icon: <Users size={22} color="#fff" />,
			grad: "st-stat-teal",
			sub: "当前生效群组",
		},
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
			{/* 欢迎横幅 */}
			<div
				style={{
					borderRadius: 16,
					background:
						"linear-gradient(135deg,#7c3aed 0%,#6366f1 50%,#0ea5e9 100%)",
					padding: "24px 28px",
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					overflow: "hidden",
					position: "relative",
				}}
			>
				{/* 背景装饰光斑 */}
				<div
					style={{
						position: "absolute",
						right: -40,
						top: -40,
						width: 200,
						height: 200,
						borderRadius: "50%",
						background: "rgba(255,255,255,0.08)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						right: 60,
						bottom: -60,
						width: 140,
						height: 140,
						borderRadius: "50%",
						background: "rgba(255,255,255,0.05)",
					}}
				/>
				<div style={{ position: "relative" }}>
					<h2
						style={{
							margin: 0,
							fontSize: 20,
							fontWeight: 700,
							color: "#fff",
						}}
					>
						欢迎回到时空万象 ✨
					</h2>
					<p
						style={{
							margin: "4px 0 0",
							fontSize: 13,
							color: "rgba(255,255,255,0.75)",
						}}
					>
						一人一宇宙，一域一时光，珍藏全家所有岁月影像
					</p>
				</div>
				<div style={{ position: "relative", display: "flex", gap: 8 }}>
					{groups.slice(0, 3).map((g) => (
						<span
							key={g.id}
							style={{
								padding: "4px 12px",
								borderRadius: 20,
								background: "rgba(255,255,255,0.18)",
								fontSize: 12,
								color: "#fff",
								border: "1px solid rgba(255,255,255,0.2)",
							}}
						>
							{g.name}
							{g.role === "owner" && (
								<span
									style={{
										marginLeft: 4,
										fontSize: 10,
										opacity: 0.8,
									}}
								>
									· 主理人
								</span>
							)}
						</span>
					))}
				</div>
			</div>

			{/* 统计卡片 */}
			<Row gutter={[16, 16]}>
				{statCards.map((s) => (
					<Col xs={24} sm={12} xl={6} key={s.label}>
						<div
							className={`st-card-hover ${s.grad}`}
							style={{
								borderRadius: 14,
								padding: "20px 22px",
								display: "flex",
								alignItems: "center",
								gap: 16,
								cursor: "default",
							}}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 12,
									background: "rgba(255,255,255,0.2)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								{s.icon}
							</div>
							<div>
								<p
									style={{
										margin: 0,
										fontSize: 26,
										fontWeight: 700,
										color: "#fff",
										lineHeight: 1.1,
									}}
								>
									{loading ? "…" : s.value}
								</p>
								<p
									style={{
										margin: "2px 0 0",
										fontSize: 13,
										color: "rgba(255,255,255,0.85)",
										fontWeight: 500,
									}}
								>
									{s.label}
								</p>
								<p
									style={{
										margin: "1px 0 0",
										fontSize: 11,
										color: "rgba(255,255,255,0.6)",
									}}
								>
									{s.sub}
								</p>
							</div>
						</div>
					</Col>
				))}
			</Row>

			{/* 最近上传 + 快速入口 */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={16}>
					<Card
						title={
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									color: "#1e1b4b",
								}}
							>
								<Clock size={15} color="#7c3aed" />
								最近上传
							</span>
						}
						style={{ borderRadius: 14 }}
					>
						{loading ? (
							<div style={{ textAlign: "center", padding: 24 }}>
								<Spin />
							</div>
						) : recentFiles.length === 0 ? (
							<Empty description="暂无影像文件，去上传第一张吧！" />
						) : (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
									gap: 8,
								}}
							>
								{recentFiles.map((f) => (
									<div
										key={f.id}
										className="st-card-hover"
										style={{
											aspectRatio: "1",
											borderRadius: 10,
											overflow: "hidden",
											background: "linear-gradient(135deg,#ede9fe,#e0e7ff)",
											position: "relative",
											cursor: "pointer",
										}}
									>
										{f.url ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={f.url}
												alt={f.original_filename ?? ""}
												style={{
													width: "100%",
													height: "100%",
													objectFit: "cover",
												}}
											/>
										) : (
											<div
												style={{
													width: "100%",
													height: "100%",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<ImageIcon size={24} color="#a78bfa" />
											</div>
										)}
										{/* 文件类型标记 */}
										{f.file_type === "video" && (
											<span
												style={{
													position: "absolute",
													top: 4,
													right: 4,
													background: "rgba(0,0,0,0.5)",
													borderRadius: 4,
													padding: "1px 4px",
													fontSize: 9,
													color: "#fff",
												}}
											>
												VIDEO
											</span>
										)}
									</div>
								))}
							</div>
						)}
					</Card>
				</Col>

				<Col xs={24} lg={8}>
					<Card
						title={
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									color: "#1e1b4b",
								}}
							>
								<TrendingUp size={15} color="#d97706" />
								快速入口
							</span>
						}
						style={{ borderRadius: 14, height: "100%" }}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							{[
								{
									href: "/upload",
									label: "上传影像",
									desc: "上传照片/视频到群组",
									color: "#7c3aed",
									bg: "rgba(124,58,237,0.08)",
								},
								{
									href: "/my-spaces",
									label: "创建空间",
									desc: "策展你的专属展览",
									color: "#d97706",
									bg: "rgba(217,119,6,0.08)",
								},
								{
									href: "/group",
									label: "邀请成员",
									desc: "按用户名搜索添加",
									color: "#0ea5e9",
									bg: "rgba(14,165,233,0.08)",
								},
								{
									href: "/styles",
									label: "配置主题",
									desc: "上传背景图/视频/动效",
									color: "#10b981",
									bg: "rgba(16,185,129,0.08)",
								},
							].map((item) => (
								<a
									key={item.href}
									href={item.href}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 12,
										padding: "10px 12px",
										borderRadius: 10,
										background: item.bg,
										textDecoration: "none",
										transition: "transform 0.18s ease",
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.transform =
											"translateX(4px)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.transform =
											"translateX(0)";
									}}
								>
									<div
										style={{
											width: 8,
											height: 8,
											borderRadius: "50%",
											background: item.color,
											flexShrink: 0,
										}}
									/>
									<div>
										<p
											style={{
												margin: 0,
												fontSize: 13,
												fontWeight: 600,
												color: item.color,
											}}
										>
											{item.label}
										</p>
										<p
											style={{
												margin: 0,
												fontSize: 11,
												color: "#8b83b4",
											}}
										>
											{item.desc}
										</p>
									</div>
								</a>
							))}
						</div>
					</Card>
				</Col>
			</Row>
		</div>
	);
}
