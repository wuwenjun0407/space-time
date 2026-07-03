"use client";

import { api } from "@/lib/api";
import type { Space } from "@/types";
import {
	Button,
	Col,
	Empty,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Row,
	Select,
	Spin,
} from "antd";
import {
	Eye,
	Globe,
	Lock,
	Pencil,
	Plus,
	Sparkles,
	Star,
	Trash2,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const { TextArea } = Input;

const VISIBILITY_CONFIG = {
	public_in_group: {
		label: "群组公开",
		color: "#0ea5e9",
		icon: <Globe size={12} />,
	},
	members: { label: "指定成员", color: "#f59e0b", icon: <Users size={12} /> },
	private: { label: "私有", color: "#94a3b8", icon: <Lock size={12} /> },
};

export default function MySpacesPage() {
	const [spaces, setSpaces] = useState<Space[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingSpace, setEditingSpace] = useState<Space | null>(null);
	const [saving, setSaving] = useState(false);
	const [form] = Form.useForm();

	const fetchSpaces = async () => {
		setLoading(true);
		try {
			const res = await api.get("/spaces?page=1&page_size=50");
			setSpaces(
				((res as { items?: Space[] })?.items ?? res) as unknown as Space[],
			);
		} catch {
			setSpaces([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSpaces();
	}, []);

	const openCreate = () => {
		setEditingSpace(null);
		form.resetFields();
		setModalOpen(true);
	};

	const openEdit = (space: Space) => {
		setEditingSpace(space);
		form.setFieldsValue({
			name: space.name,
			description: space.description,
			visibility: space.visibility,
		});
		setModalOpen(true);
	};

	const handleSave = async () => {
		const values = await form.validateFields().catch(() => null);
		if (!values) return;
		setSaving(true);
		try {
			if (editingSpace) {
				await api.put(`/spaces/${editingSpace.id}`, values);
				message.success("空间已更新");
			} else {
				await api.post("/spaces", values);
				message.success("空间已创建");
			}
			setModalOpen(false);
			fetchSpaces();
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "操作失败");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await api.delete(`/spaces/${id}`);
			message.success("已删除");
			fetchSpaces();
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "删除失败");
		}
	};

	const handleSetDefault = async (id: string) => {
		try {
			await api.post(`/spaces/${id}/set-default`);
			message.success("已设为默认空间");
			fetchSpaces();
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "操作失败");
		}
	};

	return (
		<div>
			{/* 顶部操作区 */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 20,
				}}
			>
				<div>
					<p style={{ margin: 0, fontSize: 13, color: "#8b83b4" }}>
						共 {spaces.length} 个空间 · 在群组内容中策展，创造你的专属展览
					</p>
				</div>
				<Button
					type="primary"
					icon={<Plus size={14} />}
					onClick={openCreate}
					style={{
						background: "linear-gradient(135deg,#7c3aed,#6366f1)",
						border: "none",
						borderRadius: 9,
						boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
						display: "flex",
						alignItems: "center",
						gap: 6,
					}}
				>
					新建空间
				</Button>
			</div>

			{/* 空间卡片网格 */}
			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" />
				</div>
			) : spaces.length === 0 ? (
				<Empty
					description={
						<span style={{ color: "#8b83b4" }}>
							还没有空间，点击「新建空间」开始策展你的第一个展览
						</span>
					}
					style={{ padding: "60px 0" }}
				>
					<Button type="primary" onClick={openCreate}>
						立即新建
					</Button>
				</Empty>
			) : (
				<Row gutter={[16, 16]}>
					{spaces.map((space) => {
						const vis =
							VISIBILITY_CONFIG[
								space.visibility as keyof typeof VISIBILITY_CONFIG
							] ?? VISIBILITY_CONFIG.private;
						return (
							<Col xs={24} sm={12} lg={8} xl={6} key={space.id}>
								<div
									className="st-card-hover"
									style={{
										background: "#fff",
										borderRadius: 14,
										overflow: "hidden",
										border: space.is_default
											? "2px solid rgba(124,58,237,0.35)"
											: "1px solid rgba(124,58,237,0.1)",
										boxShadow: space.is_default
											? "0 4px 20px rgba(124,58,237,0.15)"
											: "0 2px 12px rgba(109,40,217,0.06)",
										cursor: "default",
										display: "flex",
										flexDirection: "column",
									}}
								>
									{/* 封面 */}
									<div
										style={{
											height: 120,
											background: space.cover_url
												? `url(${space.cover_url}) center/cover`
												: "linear-gradient(135deg,#ede9fe 0%,#e0e7ff 100%)",
											position: "relative",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										{!space.cover_url && <Sparkles size={32} color="#c4b5fd" />}
										{space.is_default && (
											<div
												style={{
													position: "absolute",
													top: 8,
													left: 8,
													padding: "3px 8px",
													borderRadius: 20,
													background: "linear-gradient(135deg,#f59e0b,#f97316)",
													color: "#fff",
													fontSize: 11,
													fontWeight: 600,
													display: "flex",
													alignItems: "center",
													gap: 3,
												}}
											>
												<Star size={10} /> 默认
											</div>
										)}
										<div
											style={{
												position: "absolute",
												top: 8,
												right: 8,
												padding: "3px 8px",
												borderRadius: 20,
												background: "rgba(0,0,0,0.4)",
												color: "#fff",
												fontSize: 11,
												display: "flex",
												alignItems: "center",
												gap: 4,
											}}
										>
											{vis.icon}
											{vis.label}
										</div>
									</div>

									{/* 内容 */}
									<div style={{ padding: "12px 14px", flex: 1 }}>
										<h3
											style={{
												margin: 0,
												fontSize: 14,
												fontWeight: 600,
												color: "#1e1b4b",
											}}
										>
											{space.name}
										</h3>
										{space.description && (
											<p
												style={{
													margin: "4px 0 0",
													fontSize: 12,
													color: "#8b83b4",
													overflow: "hidden",
													display: "-webkit-box",
													WebkitLineClamp: 2,
													WebkitBoxOrient: "vertical",
												}}
											>
												{space.description}
											</p>
										)}
										<p
											style={{
												margin: "8px 0 0",
												fontSize: 11,
												color: "#c4b5fd",
											}}
										>
											{space.file_count} 个文件
										</p>
									</div>

									{/* 操作按钮 */}
									<div
										style={{
											padding: "8px 14px 12px",
											display: "flex",
											gap: 6,
											borderTop: "1px solid rgba(124,58,237,0.06)",
										}}
									>
										<Link href={`/my-spaces/${space.id}/curation`}>
											<Button
												size="small"
												style={{
													borderColor: "rgba(124,58,237,0.2)",
													color: "#7c3aed",
													borderRadius: 7,
													fontSize: 11,
												}}
												icon={<Eye size={11} />}
											>
												策展
											</Button>
										</Link>
										<Button
											size="small"
											style={{
												borderColor: "rgba(124,58,237,0.2)",
												color: "#7c3aed",
												borderRadius: 7,
												fontSize: 11,
											}}
											icon={<Pencil size={11} />}
											onClick={() => openEdit(space)}
										>
											编辑
										</Button>
										{!space.is_default && (
											<Button
												size="small"
												style={{
													borderColor: "rgba(217,119,6,0.2)",
													color: "#d97706",
													borderRadius: 7,
													fontSize: 11,
												}}
												icon={<Star size={11} />}
												onClick={() => handleSetDefault(space.id)}
											>
												设默认
											</Button>
										)}
										<Popconfirm
											title="确认删除这个空间？"
											description="删除后文件引用将解除，原文件不受影响。"
											onConfirm={() => handleDelete(space.id)}
											okText="确认"
											cancelText="取消"
											okButtonProps={{ danger: true }}
										>
											<Button
												size="small"
												danger
												style={{
													borderRadius: 7,
													fontSize: 11,
													marginLeft: "auto",
												}}
												icon={<Trash2 size={11} />}
											/>
										</Popconfirm>
									</div>
								</div>
							</Col>
						);
					})}
				</Row>
			)}

			{/* 新建/编辑空间 Modal */}
			<Modal
				title={editingSpace ? "编辑空间" : "新建空间"}
				open={modalOpen}
				onOk={handleSave}
				onCancel={() => setModalOpen(false)}
				confirmLoading={saving}
				okText={editingSpace ? "保存更改" : "创建空间"}
				cancelText="取消"
				destroyOnClose
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="name"
						label="空间名称"
						rules={[
							{ required: true, message: "请输入空间名称" },
							{ max: 50, message: "最多 50 个字符" },
						]}
					>
						<Input placeholder="给你的展览取个名字" maxLength={50} showCount />
					</Form.Item>
					<Form.Item name="description" label="描述（可选）">
						<TextArea
							placeholder="简单介绍一下这个空间…"
							maxLength={200}
							showCount
							rows={3}
						/>
					</Form.Item>
					<Form.Item
						name="visibility"
						label="访问权限"
						initialValue="public_in_group"
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{
									label: (
										<span
											style={{ display: "flex", alignItems: "center", gap: 6 }}
										>
											<Globe size={13} color="#0ea5e9" /> 群组公开 —
											群组内所有成员可见
										</span>
									),
									value: "public_in_group",
								},
								{
									label: (
										<span
											style={{ display: "flex", alignItems: "center", gap: 6 }}
										>
											<Users size={13} color="#f59e0b" /> 指定成员 —
											手动选择可见成员
										</span>
									),
									value: "members",
								},
								{
									label: (
										<span
											style={{ display: "flex", alignItems: "center", gap: 6 }}
										>
											<Lock size={13} color="#94a3b8" /> 私有 — 仅自己可见
										</span>
									),
									value: "private",
								},
							]}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
