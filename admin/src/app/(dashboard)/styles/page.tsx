"use client";

import { api } from "@/lib/api";
import type { Style, Theme } from "@/types";
import {
	Button,
	Card,
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
	Switch,
	Tag,
} from "antd";
import { Eye, ImageIcon, Plus, Trash2, Video, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";

const { TextArea } = Input;

export default function StylesPage() {
	const [styles, setStyles] = useState<Style[]>([]);
	const [themes, setThemes] = useState<Record<string, Theme[]>>({});
	const [activeStyle, setActiveStyle] = useState<Style | null>(null);
	const [loading, setLoading] = useState(true);
	const [styleModal, setStyleModal] = useState(false);
	const [themeModal, setThemeModal] = useState(false);
	const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
	const [saving, setSaving] = useState(false);
	const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
	const [styleForm] = Form.useForm();
	const [themeForm] = Form.useForm();

	// 加载风格列表
	const fetchStyles = async () => {
		setLoading(true);
		try {
			const res = await api.get("/styles");
			const list = res as unknown as Style[];
			setStyles(list);
			if (list.length > 0 && !activeStyle) setActiveStyle(list[0]);
		} catch {
			setStyles([]);
		} finally {
			setLoading(false);
		}
	};

	// 加载主题
	const fetchThemes = async (styleId: string) => {
		if (themes[styleId]) return;
		try {
			const res = await api.get(`/themes?style_id=${styleId}`);
			const list = res as unknown as Theme[];
			setThemes((prev) => ({ ...prev, [styleId]: list }));
		} catch {
			setThemes((prev) => ({ ...prev, [styleId]: [] }));
		}
	};

	useEffect(() => {
		fetchStyles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (activeStyle) fetchThemes(activeStyle.id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeStyle]);

	// 保存风格
	const handleSaveStyle = async () => {
		const values = await styleForm.validateFields().catch(() => null);
		if (!values) return;
		setSaving(true);
		try {
			await api.post("/styles", values);
			message.success("风格已创建");
			setStyleModal(false);
			styleForm.resetFields();
			fetchStyles();
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "创建失败");
		} finally {
			setSaving(false);
		}
	};

	// 保存主题
	const handleSaveTheme = async () => {
		const values = await themeForm.validateFields().catch(() => null);
		if (!values || !activeStyle) return;
		setSaving(true);
		try {
			const payload = {
				...values,
				style_id: activeStyle.id,
			};
			if (editingTheme) {
				await api.put(`/themes/${editingTheme.id}`, payload);
				message.success("主题已更新");
			} else {
				await api.post("/themes", payload);
				message.success("主题已创建");
			}
			setThemeModal(false);
			themeForm.resetFields();
			// 刷新主题列表
			setThemes((prev) => {
				const copy = { ...prev };
				delete copy[activeStyle.id];
				return copy;
			});
			fetchThemes(activeStyle.id);
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "操作失败");
		} finally {
			setSaving(false);
		}
	};

	const openCreateTheme = () => {
		setEditingTheme(null);
		themeForm.resetFields();
		setThemeModal(true);
	};

	const openEditTheme = (theme: Theme) => {
		setEditingTheme(theme);
		themeForm.setFieldsValue({
			name: theme.name,
			color_mode: theme.color_mode,
			bg_image_url: theme.bg_image_url,
			bg_video_url: theme.bg_video_url,
			effect_config: theme.effect_config
				? JSON.stringify(theme.effect_config, null, 2)
				: "",
			is_active: theme.is_active,
		});
		setThemeModal(true);
	};

	const handleDeleteTheme = async (id: string) => {
		if (!activeStyle) return;
		try {
			await api.delete(`/themes/${id}`);
			message.success("主题已删除");
			setThemes((prev) => ({
				...prev,
				[activeStyle.id]: (prev[activeStyle.id] ?? []).filter(
					(t) => t.id !== id,
				),
			}));
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "删除失败");
		}
	};

	const activeThemes = activeStyle ? (themes[activeStyle.id] ?? null) : null;

	return (
		<div>
			<Row gutter={[16, 16]}>
				{/* 风格列表 */}
				<Col xs={24} sm={7} lg={6}>
					<Card
						title={<span style={{ color: "#1e1b4b" }}>风格分类</span>}
						style={{ borderRadius: 14 }}
						extra={
							<Button
								size="small"
								type="primary"
								icon={<Plus size={13} />}
								style={{
									borderRadius: 7,
									background: "linear-gradient(135deg,#7c3aed,#6366f1)",
									border: "none",
								}}
								onClick={() => {
									styleForm.resetFields();
									setStyleModal(true);
								}}
							>
								新建风格
							</Button>
						}
					>
						{loading ? (
							<div style={{ textAlign: "center", padding: 30 }}>
								<Spin />
							</div>
						) : styles.length === 0 ? (
							<Empty description="暂无风格" />
						) : (
							<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
								{styles.map((s) => (
									<button
										key={s.id}
										onClick={() => setActiveStyle(s)}
										style={{
											width: "100%",
											padding: "10px 12px",
											borderRadius: 10,
											border:
												activeStyle?.id === s.id
													? "1px solid rgba(124,58,237,0.25)"
													: "1px solid transparent",
											background:
												activeStyle?.id === s.id
													? "rgba(124,58,237,0.08)"
													: "transparent",
											cursor: "pointer",
											textAlign: "left",
											transition: "all 0.18s ease",
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<div>
											<p
												style={{
													margin: 0,
													fontSize: 13,
													fontWeight: activeStyle?.id === s.id ? 600 : 400,
													color: "#1e1b4b",
												}}
											>
												{s.name}
											</p>
											<p
												style={{
													margin: 0,
													fontSize: 10,
													color: "#8b83b4",
												}}
											>
												{s.key}
											</p>
										</div>
										{!s.is_active && (
											<Tag color="default" style={{ fontSize: 9, margin: 0 }}>
												下架
											</Tag>
										)}
									</button>
								))}
							</div>
						)}
					</Card>
				</Col>

				{/* 主题列表 */}
				<Col xs={24} sm={17} lg={18}>
					<Card
						title={
							<span style={{ color: "#1e1b4b" }}>
								{activeStyle ? `「${activeStyle.name}」主题` : "主题列表"}
							</span>
						}
						style={{ borderRadius: 14 }}
						extra={
							activeStyle && (
								<Button
									type="primary"
									icon={<Plus size={14} />}
									style={{
										borderRadius: 9,
										background: "linear-gradient(135deg,#7c3aed,#6366f1)",
										border: "none",
										boxShadow: "0 3px 12px rgba(124,58,237,0.3)",
									}}
									onClick={openCreateTheme}
								>
									新建主题
								</Button>
							)
						}
					>
						{!activeStyle ? (
							<Empty description="请先选择风格" />
						) : activeThemes === null ? (
							<div style={{ textAlign: "center", padding: 40 }}>
								<Spin />
							</div>
						) : activeThemes.length === 0 ? (
							<Empty description="该风格下暂无主题">
								<Button type="primary" onClick={openCreateTheme}>
									立即新建
								</Button>
							</Empty>
						) : (
							<Row gutter={[12, 12]}>
								{activeThemes.map((theme) => (
									<Col xs={24} sm={12} lg={8} xl={6} key={theme.id}>
										<div
											className="st-card-hover"
											style={{
												borderRadius: 12,
												overflow: "hidden",
												border: "1px solid rgba(124,58,237,0.1)",
												background: "#fff",
											}}
										>
											{/* 预览区 */}
											<div
												style={{
													height: 100,
													background: theme.bg_image_url
														? `url(${theme.bg_image_url}) center/cover`
														: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)",
													position: "relative",
													overflow: "hidden",
												}}
											>
												{/* 动效指示 */}
												{Object.keys(theme.effect_config ?? {}).length > 0 && (
													<div
														style={{
															position: "absolute",
															top: 6,
															left: 6,
															padding: "2px 6px",
															borderRadius: 6,
															background: "rgba(124,58,237,0.7)",
															color: "#fff",
															fontSize: 9,
															display: "flex",
															alignItems: "center",
															gap: 3,
															backdropFilter: "blur(4px)",
														}}
													>
														<Wand2 size={9} /> 动效
													</div>
												)}
												<div
													style={{
														position: "absolute",
														top: 6,
														right: 6,
														padding: "2px 6px",
														borderRadius: 6,
														background:
															theme.color_mode === "dark"
																? "rgba(0,0,0,0.5)"
																: "rgba(255,255,255,0.7)",
														color:
															theme.color_mode === "dark" ? "#fff" : "#1e1b4b",
														fontSize: 9,
														backdropFilter: "blur(4px)",
													}}
												>
													{theme.color_mode === "dark"
														? "暗色模式"
														: "亮色模式"}
												</div>
												{theme.bg_video_url && (
													<div
														style={{
															position: "absolute",
															bottom: 6,
															left: 6,
															padding: "2px 6px",
															borderRadius: 6,
															background: "rgba(0,0,0,0.5)",
															color: "#fff",
															fontSize: 9,
															display: "flex",
															alignItems: "center",
															gap: 3,
														}}
													>
														<Video size={9} /> 视频背景
													</div>
												)}

												{/* 预览按钮 */}
												<button
													onClick={() => setPreviewTheme(theme)}
													style={{
														position: "absolute",
														inset: 0,
														background: "transparent",
														border: "none",
														cursor: "pointer",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														opacity: 0,
														transition: "opacity 0.18s",
													}}
													onMouseEnter={(e) =>
														((e.currentTarget as HTMLElement).style.opacity =
															"1")
													}
													onMouseLeave={(e) =>
														((e.currentTarget as HTMLElement).style.opacity =
															"0")
													}
												>
													<div
														style={{
															padding: "6px 12px",
															borderRadius: 8,
															background: "rgba(0,0,0,0.6)",
															color: "#fff",
															fontSize: 12,
															display: "flex",
															alignItems: "center",
															gap: 5,
															backdropFilter: "blur(4px)",
														}}
													>
														<Eye size={12} /> 预览
													</div>
												</button>
											</div>

											{/* 主题信息 */}
											<div style={{ padding: "10px 12px" }}>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														marginBottom: 6,
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
														{theme.name}
													</p>
													{!theme.is_active && (
														<Tag color="default" style={{ fontSize: 9 }}>
															下架
														</Tag>
													)}
													{theme.is_system && (
														<Tag color="purple" style={{ fontSize: 9 }}>
															系统
														</Tag>
													)}
												</div>
												<div
													style={{
														display: "flex",
														gap: 6,
														flexWrap: "wrap",
													}}
												>
													{theme.bg_image_url && (
														<span
															style={{
																fontSize: 10,
																color: "#8b83b4",
																display: "flex",
																alignItems: "center",
																gap: 2,
															}}
														>
															<ImageIcon size={10} /> 背景图
														</span>
													)}
													{theme.bg_video_url && (
														<span
															style={{
																fontSize: 10,
																color: "#8b83b4",
																display: "flex",
																alignItems: "center",
																gap: 2,
															}}
														>
															<Video size={10} /> 背景视频
														</span>
													)}
												</div>
											</div>

											{/* 操作 */}
											<div
												style={{
													padding: "6px 12px 10px",
													display: "flex",
													gap: 6,
													borderTop: "1px solid rgba(124,58,237,0.06)",
												}}
											>
												<Button
													size="small"
													style={{
														borderColor: "rgba(124,58,237,0.2)",
														color: "#7c3aed",
														borderRadius: 7,
														fontSize: 11,
													}}
													onClick={() => openEditTheme(theme)}
												>
													编辑
												</Button>
												{!theme.is_system && (
													<Popconfirm
														title="确认删除此主题？"
														onConfirm={() => handleDeleteTheme(theme.id)}
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
												)}
											</div>
										</div>
									</Col>
								))}
							</Row>
						)}
					</Card>
				</Col>
			</Row>

			{/* 预置风格提示 */}
			<div
				style={{
					marginTop: 4,
					padding: "12px 16px",
					borderRadius: 10,
					background: "rgba(124,58,237,0.05)",
					border: "1px solid rgba(124,58,237,0.1)",
					fontSize: 12,
					color: "#8b83b4",
				}}
			>
				系统预置 8 套风格（科技/乡村/纯欲/复古/国风/童趣/极简/暗夜），共 16
				个主题，is_system = true 的主题建议谨慎修改。
			</div>

			{/* 新建风格 Modal */}
			<Modal
				title="新建风格"
				open={styleModal}
				onOk={handleSaveStyle}
				onCancel={() => setStyleModal(false)}
				confirmLoading={saving}
				okText="创建"
				cancelText="取消"
				destroyOnClose
			>
				<Form form={styleForm} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="name"
						label="风格名称"
						rules={[{ required: true, message: "请输入风格名称" }]}
					>
						<Input placeholder="如：科技风、乡村风" maxLength={30} />
					</Form.Item>
					<Form.Item
						name="key"
						label="标识 Key"
						rules={[
							{ required: true, message: "请输入 Key" },
							{
								pattern: /^[a-z_]+$/,
								message: "只能包含小写字母和下划线",
							},
						]}
					>
						<Input placeholder="如：sci_tech（小写字母+下划线）" />
					</Form.Item>
					<Form.Item name="sort_order" label="排序值（越小越靠前）">
						<Input type="number" placeholder="0" />
					</Form.Item>
				</Form>
			</Modal>

			{/* 新建/编辑主题 Modal */}
			<Modal
				title={editingTheme ? `编辑主题：${editingTheme.name}` : "新建主题"}
				open={themeModal}
				onOk={handleSaveTheme}
				onCancel={() => setThemeModal(false)}
				confirmLoading={saving}
				okText={editingTheme ? "保存" : "创建"}
				cancelText="取消"
				width={560}
				destroyOnClose
			>
				<Form form={themeForm} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="name"
						label="主题名称"
						rules={[{ required: true, message: "请输入主题名称" }]}
					>
						<Input placeholder="如：银河漫游" maxLength={50} />
					</Form.Item>
					<Form.Item
						name="color_mode"
						label="色彩模式"
						initialValue="dark"
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{ label: "暗色 Dark — 浅色文字/卡片", value: "dark" },
								{ label: "亮色 Light — 深色文字/卡片", value: "light" },
							]}
						/>
					</Form.Item>
					<Form.Item name="bg_image_url" label="背景图 URL（与背景视频二选一）">
						<Input placeholder="七牛存储 URL 或外部图片 URL" />
					</Form.Item>
					<Form.Item name="bg_video_url" label="背景视频 URL（可选）">
						<Input placeholder="七牛存储视频 URL" />
					</Form.Item>
					<Form.Item name="effect_config" label="动效配置 JSON（可选）">
						<TextArea
							placeholder={
								'{"type": "particles", "count": 80, "color": "#ffffff", "opacity": 0.6}'
							}
							rows={4}
							style={{ fontFamily: "monospace", fontSize: 12 }}
						/>
					</Form.Item>
					<Form.Item
						name="is_active"
						label="是否上架"
						valuePropName="checked"
						initialValue={true}
					>
						<Switch />
					</Form.Item>
				</Form>
			</Modal>

			{/* 主题预览 Modal */}
			<Modal
				open={!!previewTheme}
				onCancel={() => setPreviewTheme(null)}
				footer={null}
				width={600}
				title={`预览：${previewTheme?.name ?? ""}`}
				bodyStyle={{ padding: 0 }}
			>
				{previewTheme && (
					<div
						style={{
							height: 340,
							background: previewTheme.bg_image_url
								? `url(${previewTheme.bg_image_url}) center/cover`
								: "linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#0c1445 100%)",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							position: "relative",
							overflow: "hidden",
						}}
					>
						{previewTheme.bg_video_url && (
							<video
								src={previewTheme.bg_video_url}
								autoPlay
								muted
								loop
								style={{
									position: "absolute",
									inset: 0,
									width: "100%",
									height: "100%",
									objectFit: "cover",
								}}
							/>
						)}
						<div
							style={{
								position: "relative",
								textAlign: "center",
								zIndex: 1,
							}}
						>
							<p
								style={{
									fontSize: 28,
									fontWeight: 700,
									color:
										previewTheme.color_mode === "dark" ? "#ffffff" : "#1e1b4b",
									margin: "0 0 6px",
									textShadow:
										previewTheme.color_mode === "dark"
											? "0 2px 12px rgba(0,0,0,0.5)"
											: "none",
								}}
							>
								{previewTheme.name}
							</p>
							<p
								style={{
									fontSize: 13,
									color:
										previewTheme.color_mode === "dark"
											? "rgba(255,255,255,0.7)"
											: "rgba(30,27,75,0.6)",
									margin: 0,
								}}
							>
								时空万象 · 影像记忆
							</p>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
