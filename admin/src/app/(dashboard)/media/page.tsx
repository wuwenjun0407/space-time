"use client";

import { api } from "@/lib/api";
import type { Category, Group, MediaFile } from "@/types";
import {
	Button,
	Card,
	DatePicker,
	Empty,
	Image,
	Input,
	Modal,
	Popconfirm,
	Select,
	Space,
	Spin,
	Tag,
	Tooltip,
} from "antd";
import dayjs from "dayjs";
import {
	FileImage,
	FileVideo,
	Grid3x3,
	Info,
	List,
	Search,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const { RangePicker } = DatePicker;

type ViewMode = "grid" | "list";

export default function MediaPage() {
	const [files, setFiles] = useState<MediaFile[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [groups, setGroups] = useState<Group[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<string>("");
	const [filterType, setFilterType] = useState<string>("");
	const [filterCat, setFilterCat] = useState<string>("");
	const [searchKw, setSearchKw] = useState<string>("");
	const [detailFile, setDetailFile] = useState<MediaFile | null>(null);

	// 加载群组
	useEffect(() => {
		api
			.get("/groups")
			.then((res) => {
				const grps = res as unknown as Group[];
				setGroups(grps);
				const active = grps.find((g) => g.is_active) ?? grps[0];
				if (active) setSelectedGroup(active.id);
			})
			.catch(() => {});
	}, []);

	// 加载分类
	useEffect(() => {
		if (!selectedGroup) return;
		api
			.get(`/categories?group_id=${selectedGroup}`)
			.then((res) => setCategories(res as unknown as Category[]))
			.catch(() => setCategories([]));
	}, [selectedGroup]);

	// 加载文件列表
	const fetchFiles = (pg = 1) => {
		setLoading(true);
		const params = new URLSearchParams({
			page: String(pg),
			page_size: "24",
		});
		if (selectedGroup) params.set("group_id", selectedGroup);
		if (filterType) params.set("file_type", filterType);
		if (filterCat) params.set("category_id", filterCat);
		if (searchKw) params.set("q", searchKw);

		api
			.get(`/files?${params}`)
			.then((res) => {
				const r = res as unknown as { items: MediaFile[]; total: number };
				setFiles(r.items ?? []);
				setTotal(r.total ?? 0);
				setPage(pg);
			})
			.catch(() => setFiles([]))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		if (selectedGroup) fetchFiles(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedGroup, filterType, filterCat, searchKw]);

	const handleDelete = async (id: string) => {
		try {
			await api.delete(`/files/${id}`);
			setFiles((prev) => prev.filter((f) => f.id !== id));
			setTotal((t) => t - 1);
		} catch (e: unknown) {
			const err = e as { message?: string };
			Modal.error({ title: "删除失败", content: err?.message ?? "请稍后重试" });
		}
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			{/* 筛选工具栏 */}
			<Card style={{ borderRadius: 14, padding: 0 }}>
				<div
					style={{
						display: "flex",
						gap: 10,
						flexWrap: "wrap",
						alignItems: "center",
					}}
				>
					<Select
						value={selectedGroup}
						onChange={setSelectedGroup}
						style={{ width: 160 }}
						placeholder="选择群组"
						options={groups.map((g) => ({
							label: g.name + (g.is_active ? " ·生效" : ""),
							value: g.id,
						}))}
					/>
					<Select
						value={filterType}
						onChange={setFilterType}
						style={{ width: 110 }}
						allowClear
						placeholder="文件类型"
						options={[
							{ label: "图片", value: "image" },
							{ label: "视频", value: "video" },
						]}
					/>
					<Select
						value={filterCat}
						onChange={setFilterCat}
						style={{ width: 130 }}
						allowClear
						placeholder="分类筛选"
						options={categories.map((c) => ({
							label: c.name,
							value: c.id,
						}))}
					/>
					<Input
						prefix={<Search size={13} color="#9ca3af" />}
						placeholder="搜索文件描述…"
						value={searchKw}
						onChange={(e) => setSearchKw(e.target.value)}
						style={{ width: 200, borderRadius: 8 }}
						allowClear
					/>
					<div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
						<Tooltip title="网格视图">
							<Button
								size="small"
								type={viewMode === "grid" ? "primary" : "default"}
								icon={<Grid3x3 size={14} />}
								onClick={() => setViewMode("grid")}
								style={{
									borderRadius: 7,
									...(viewMode === "grid"
										? {
												background: "linear-gradient(135deg,#7c3aed,#6366f1)",
												border: "none",
											}
										: {}),
								}}
							/>
						</Tooltip>
						<Tooltip title="列表视图">
							<Button
								size="small"
								type={viewMode === "list" ? "primary" : "default"}
								icon={<List size={14} />}
								onClick={() => setViewMode("list")}
								style={{
									borderRadius: 7,
									...(viewMode === "list"
										? {
												background: "linear-gradient(135deg,#7c3aed,#6366f1)",
												border: "none",
											}
										: {}),
								}}
							/>
						</Tooltip>
					</div>
				</div>
				<p style={{ margin: "10px 0 0", fontSize: 12, color: "#8b83b4" }}>
					共 {total} 个文件
				</p>
			</Card>

			{/* 文件展示区 */}
			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" />
				</div>
			) : files.length === 0 ? (
				<Empty description="暂无影像文件" style={{ padding: "60px 0" }} />
			) : viewMode === "grid" ? (
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
						gap: 10,
					}}
				>
					{files.map((f) => (
						<div
							key={f.id}
							className="st-card-hover"
							style={{
								borderRadius: 12,
								overflow: "hidden",
								background: "#fff",
								border: "1px solid rgba(124,58,237,0.08)",
								cursor: "pointer",
								position: "relative",
							}}
						>
							{/* 缩略图 */}
							<div
								style={{
									aspectRatio: "1",
									background: "linear-gradient(135deg,#ede9fe,#e0e7ff)",
									overflow: "hidden",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
								onClick={() => setDetailFile(f)}
							>
								{f.url ? (
									<Image
										src={f.url}
										alt={f.original_filename ?? ""}
										style={{
											width: "100%",
											height: "100%",
											objectFit: "cover",
										}}
										preview={false}
									/>
								) : f.file_type === "video" ? (
									<FileVideo size={32} color="#a78bfa" />
								) : (
									<FileImage size={32} color="#a78bfa" />
								)}
							</div>
							{/* 类型标记 */}
							{f.file_type === "video" && (
								<div
									style={{
										position: "absolute",
										top: 6,
										left: 6,
										background: "rgba(0,0,0,0.5)",
										borderRadius: 4,
										padding: "2px 5px",
										fontSize: 9,
										color: "#fff",
										fontWeight: 600,
									}}
								>
									VIDEO
								</div>
							)}
							{/* 操作浮层 */}
							<div
								style={{
									padding: "6px 8px",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<p
									style={{
										margin: 0,
										fontSize: 10,
										color: "#8b83b4",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										flex: 1,
									}}
								>
									{f.original_filename ?? f.id.slice(0, 8)}
								</p>
								<div style={{ display: "flex", gap: 4 }}>
									<Tooltip title="详情">
										<button
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "#9ca3af",
												padding: 2,
											}}
											onClick={() => setDetailFile(f)}
										>
											<Info size={12} />
										</button>
									</Tooltip>
									<Popconfirm
										title="删除此文件？"
										description="所有引用该文件的空间将自动解除引用。"
										onConfirm={() => handleDelete(f.id)}
										okText="确认"
										cancelText="取消"
										okButtonProps={{ danger: true }}
									>
										<button
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "#f87171",
												padding: 2,
											}}
										>
											<Trash2 size={12} />
										</button>
									</Popconfirm>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				/* 列表模式 */
				<Card style={{ borderRadius: 14 }}>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						{files.map((f) => (
							<div
								key={f.id}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 12,
									padding: "8px 12px",
									borderRadius: 10,
									background: "rgba(124,58,237,0.02)",
									border: "1px solid rgba(124,58,237,0.06)",
									transition: "background 0.15s",
								}}
								onMouseEnter={(e) =>
									((e.currentTarget as HTMLElement).style.background =
										"rgba(124,58,237,0.05)")
								}
								onMouseLeave={(e) =>
									((e.currentTarget as HTMLElement).style.background =
										"rgba(124,58,237,0.02)")
								}
							>
								{/* 缩略图 */}
								<div
									style={{
										width: 40,
										height: 40,
										borderRadius: 8,
										overflow: "hidden",
										flexShrink: 0,
										background: "#ede9fe",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{f.url ? (
										<Image
											src={f.url}
											alt=""
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
											}}
											preview={false}
										/>
									) : f.file_type === "video" ? (
										<FileVideo size={18} color="#7c3aed" />
									) : (
										<FileImage size={18} color="#7c3aed" />
									)}
								</div>

								<div style={{ flex: 1, minWidth: 0 }}>
									<p
										style={{
											margin: 0,
											fontSize: 13,
											fontWeight: 500,
											color: "#1e1b4b",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{f.original_filename ?? "—"}
									</p>
									<p style={{ margin: 0, fontSize: 11, color: "#8b83b4" }}>
										{dayjs(f.created_at).format("YYYY-MM-DD HH:mm")}
									</p>
								</div>

								<Tag color={f.file_type === "video" ? "purple" : "blue"}>
									{f.file_type === "video" ? "视频" : "图片"}
								</Tag>

								<Tag color={f.status === "ready" ? "green" : "orange"}>
									{f.status === "ready" ? "正常" : f.status}
								</Tag>

								<Space>
									<Popconfirm
										title="删除此文件？"
										onConfirm={() => handleDelete(f.id)}
										okText="确认"
										cancelText="取消"
										okButtonProps={{ danger: true }}
									>
										<Button
											size="small"
											danger
											icon={<Trash2 size={12} />}
											style={{ borderRadius: 7 }}
										>
											删除
										</Button>
									</Popconfirm>
								</Space>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* 文件详情 Modal */}
			<Modal
				title={detailFile?.original_filename ?? "文件详情"}
				open={!!detailFile}
				onCancel={() => setDetailFile(null)}
				footer={null}
				width={520}
			>
				{detailFile && (
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						{/* 预览 */}
						{detailFile.url && (
							<div
								style={{
									borderRadius: 12,
									overflow: "hidden",
									maxHeight: 280,
									background: "#000",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{detailFile.file_type === "video" ? (
									<video
										src={detailFile.url}
										controls
										style={{ maxWidth: "100%", maxHeight: 280 }}
									/>
								) : (
									<Image
										src={detailFile.url}
										alt=""
										style={{ maxWidth: "100%", maxHeight: 280 }}
									/>
								)}
							</div>
						)}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "100px 1fr",
								gap: 8,
								fontSize: 13,
							}}
						>
							{[
								["文件名", detailFile.original_filename ?? "—"],
								["类型", detailFile.file_type === "video" ? "视频" : "图片"],
								["状态", detailFile.status],
								["描述", detailFile.description ?? "（无）"],
								[
									"上传时间",
									dayjs(detailFile.created_at).format("YYYY-MM-DD HH:mm:ss"),
								],
							].map(([label, val]) => (
								<>
									<span key={`l-${label}`} style={{ color: "#8b83b4" }}>
										{label}
									</span>
									<span
										key={`v-${label}`}
										style={{ color: "#1e1b4b", fontWeight: 500 }}
									>
										{val}
									</span>
								</>
							))}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
