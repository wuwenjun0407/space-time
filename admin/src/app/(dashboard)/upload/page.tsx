"use client";

import { api } from "@/lib/api";
import type { Category, Group } from "@/types";
import {
	Button,
	Card,
	Form,
	Input,
	message,
	Progress,
	Select,
	Tag,
	Upload,
} from "antd";
import {
	AlertCircle,
	CloudUpload,
	FileImage,
	FileVideo,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const { Dragger } = Upload;
const { TextArea } = Input;

interface FileItem {
	uid: string;
	name: string;
	size: number;
	type: string;
	file: File;
	previewUrl?: string;
	progress: number;
	status: "pending" | "uploading" | "done" | "error";
	error?: string;
}

function formatSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function UploadPage() {
	const [form] = Form.useForm();
	const [files, setFiles] = useState<FileItem[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [categories, setCategories] = useState<Record<string, Category[]>>({});
	const [uploading, setUploading] = useState(false);
	const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

	useEffect(() => {
		api
			.get("/groups")
			.then((res) => {
				const grps = res as unknown as Group[];
				setGroups(grps);
			})
			.catch(() => setGroups([]));
	}, []);

	// 加载群组分类
	useEffect(() => {
		selectedGroups.forEach(async (gid) => {
			if (!categories[gid]) {
				try {
					const cats = await api.get(`/categories?group_id=${gid}`);
					setCategories((prev) => ({
						...prev,
						[gid]: cats as unknown as Category[],
					}));
				} catch {
					setCategories((prev) => ({ ...prev, [gid]: [] }));
				}
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedGroups]);

	const validateFile = (file: File): string | null => {
		const imgTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
		const vidTypes = ["video/mp4", "video/quicktime"];
		const maxImg = 50 * 1024 * 1024; // 50MB
		const maxVid = 1024 * 1024 * 1024; // 1GB
		const isImg = imgTypes.includes(file.type);
		const isVid = vidTypes.includes(file.type);
		if (!isImg && !isVid) return "仅支持 JPG / PNG / WebP / HEIC / MP4 / MOV";
		if (isImg && file.size > maxImg)
			return `图片不能超过 50MB（当前 ${formatSize(file.size)}）`;
		if (isVid && file.size > maxVid)
			return `视频不能超过 1GB（当前 ${formatSize(file.size)}）`;
		return null;
	};

	const handleAddFiles = (newFiles: File[]) => {
		if (files.length + newFiles.length > 50) {
			message.warning("单次最多上传 50 个文件");
			return false;
		}
		const items: FileItem[] = [];
		for (const file of newFiles) {
			const err = validateFile(file);
			const previewUrl = file.type.startsWith("image/")
				? URL.createObjectURL(file)
				: undefined;
			items.push({
				uid: `${Date.now()}-${Math.random()}`,
				name: file.name,
				size: file.size,
				type: file.type,
				file,
				previewUrl,
				progress: 0,
				status: err ? "error" : "pending",
				error: err ?? undefined,
			});
		}
		setFiles((prev) => [...prev, ...items]);
		return false; // 阻止 antd 自动上传
	};

	const removeFile = (uid: string) => {
		setFiles((prev) => {
			const f = prev.find((x) => x.uid === uid);
			if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
			return prev.filter((x) => x.uid !== uid);
		});
	};

	const handleUpload = async () => {
		if (files.length === 0) {
			message.warning("请先选择要上传的文件");
			return;
		}
		const validFiles = files.filter((f) => f.status !== "error");
		if (validFiles.length === 0) {
			message.warning("没有可上传的有效文件");
			return;
		}
		const values = await form.validateFields().catch(() => null);
		if (!values) return;
		if (!values.groups || values.groups.length === 0) {
			message.warning("请选择目标群组");
			return;
		}

		setUploading(true);
		let successCount = 0;

		for (const fileItem of validFiles) {
			setFiles((prev) =>
				prev.map((f) =>
					f.uid === fileItem.uid
						? { ...f, status: "uploading", progress: 0 }
						: f,
				),
			);

			for (const groupId of values.groups as string[]) {
				try {
					// 申请上传 token
					const tokenRes = await api.post("/upload/token", {
						group_id: groupId,
						filename: fileItem.name,
						file_type: fileItem.type.startsWith("video/") ? "video" : "image",
					});
					const { upload_token, key } = tokenRes as unknown as {
						upload_token: string;
						key: string;
					};

					// 七牛直传
					const formData = new FormData();
					formData.append("token", upload_token);
					formData.append("key", key);
					formData.append("file", fileItem.file);

					await new Promise<void>((resolve, reject) => {
						const xhr = new XMLHttpRequest();
						xhr.upload.onprogress = (e) => {
							if (e.lengthComputable) {
								const pct = Math.round((e.loaded / e.total) * 100);
								setFiles((prev) =>
									prev.map((f) =>
										f.uid === fileItem.uid ? { ...f, progress: pct } : f,
									),
								);
							}
						};
						xhr.onload = () =>
							xhr.status < 300 ? resolve() : reject(new Error("上传失败"));
						xhr.onerror = () => reject(new Error("网络错误"));
						xhr.open("POST", "https://up.qiniup.com");
						xhr.send(formData);
					});

					successCount++;
				} catch (e: unknown) {
					const err = e as { message?: string };
					setFiles((prev) =>
						prev.map((f) =>
							f.uid === fileItem.uid
								? { ...f, status: "error", error: err?.message ?? "上传失败" }
								: f,
						),
					);
				}
			}

			setFiles((prev) =>
				prev.map((f) =>
					f.uid === fileItem.uid && f.status !== "error"
						? { ...f, status: "done", progress: 100 }
						: f,
				),
			);
		}

		setUploading(false);
		if (successCount > 0) {
			message.success(`成功上传 ${successCount} 个文件`);
		}
	};

	const pendingCount = files.filter((f) => f.status === "pending").length;
	const doneCount = files.filter((f) => f.status === "done").length;

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "1fr 340px",
				gap: 20,
				alignItems: "start",
			}}
		>
			{/* 左：上传区 + 文件列表 */}
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{/* 拖拽上传区 */}
				<Card style={{ borderRadius: 14 }}>
					<Dragger
						multiple
						showUploadList={false}
						beforeUpload={(_, fileList) => {
							handleAddFiles(fileList.map((f) => f as unknown as File));
							return false;
						}}
						style={{ borderColor: "rgba(124,58,237,0.25)", borderRadius: 12 }}
					>
						<div style={{ padding: "20px 0" }}>
							<div
								style={{
									width: 56,
									height: 56,
									borderRadius: 14,
									background:
										"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(99,102,241,0.1))",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									margin: "0 auto 12px",
								}}
							>
								<CloudUpload size={26} color="#7c3aed" />
							</div>
							<p
								style={{
									margin: 0,
									fontSize: 15,
									fontWeight: 600,
									color: "#1e1b4b",
								}}
							>
								拖拽文件到此处，或点击选择
							</p>
							<p style={{ margin: "6px 0 0", fontSize: 12, color: "#8b83b4" }}>
								支持 JPG / PNG / WebP / HEIC / MP4 / MOV
								<br />
								图片 ≤ 50MB · 视频 ≤ 1GB · 单次 ≤ 50 个
							</p>
						</div>
					</Dragger>
				</Card>

				{/* 文件列表 */}
				{files.length > 0 && (
					<Card
						title={
							<span style={{ color: "#1e1b4b", fontSize: 14 }}>
								已选文件 <Tag color="purple">{files.length} 个</Tag>
								{doneCount > 0 && <Tag color="green">{doneCount} 已完成</Tag>}
							</span>
						}
						style={{ borderRadius: 14 }}
						extra={
							<Button
								size="small"
								danger
								onClick={() => {
									files.forEach((f) => {
										if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
									});
									setFiles([]);
								}}
							>
								清空
							</Button>
						}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 8,
								maxHeight: 360,
								overflowY: "auto",
							}}
						>
							{files.map((f) => (
								<div
									key={f.uid}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 10,
										padding: "8px 10px",
										borderRadius: 10,
										background:
											f.status === "error"
												? "rgba(239,68,68,0.05)"
												: f.status === "done"
													? "rgba(16,185,129,0.05)"
													: "rgba(124,58,237,0.04)",
										border: `1px solid ${
											f.status === "error"
												? "rgba(239,68,68,0.15)"
												: f.status === "done"
													? "rgba(16,185,129,0.15)"
													: "rgba(124,58,237,0.08)"
										}`,
									}}
								>
									{/* 缩略图 */}
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											overflow: "hidden",
											background: "#ede9fe",
											flexShrink: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										{f.previewUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={f.previewUrl}
												alt=""
												style={{
													width: "100%",
													height: "100%",
													objectFit: "cover",
												}}
											/>
										) : f.type.startsWith("video/") ? (
											<FileVideo size={18} color="#7c3aed" />
										) : (
											<FileImage size={18} color="#7c3aed" />
										)}
									</div>

									{/* 信息 */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<p
											style={{
												margin: 0,
												fontSize: 12,
												fontWeight: 500,
												color: "#1e1b4b",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{f.name}
										</p>
										<p
											style={{
												margin: 0,
												fontSize: 11,
												color: "#8b83b4",
											}}
										>
											{formatSize(f.size)}
										</p>
										{f.status === "uploading" && (
											<Progress
												percent={f.progress}
												size="small"
												strokeColor="#7c3aed"
												style={{ margin: "2px 0 0" }}
											/>
										)}
										{f.status === "error" && f.error && (
											<p
												style={{
													margin: 0,
													fontSize: 11,
													color: "#ef4444",
													display: "flex",
													alignItems: "center",
													gap: 3,
												}}
											>
												<AlertCircle size={10} /> {f.error}
											</p>
										)}
									</div>

									{/* 状态 + 删除 */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											flexShrink: 0,
										}}
									>
										{f.status === "done" && <Tag color="green">完成</Tag>}
										{f.status === "pending" && <Tag color="purple">待上传</Tag>}
										{f.status === "uploading" && <Tag color="blue">上传中</Tag>}
										{f.status === "error" && <Tag color="red">失败</Tag>}
										<button
											onClick={() => removeFile(f.uid)}
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "#9ca3af",
												padding: 2,
											}}
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>
							))}
						</div>
					</Card>
				)}
			</div>

			{/* 右：配置 + 上传按钮 */}
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<Card
					title={<span style={{ color: "#1e1b4b" }}>上传配置</span>}
					style={{ borderRadius: 14 }}
				>
					<Form form={form} layout="vertical">
						<Form.Item
							name="groups"
							label="目标群组"
							rules={[{ required: true, message: "请选择至少一个群组" }]}
						>
							<Select
								mode="multiple"
								placeholder="选择要上传到的群组（可多选）"
								onChange={(val: string[]) => setSelectedGroups(val)}
								options={groups.map((g) => ({
									label: (
										<span>
											{g.name}
											{g.role === "owner" && (
												<Tag
													color="purple"
													style={{ marginLeft: 6, fontSize: 10 }}
												>
													主理人
												</Tag>
											)}
										</span>
									),
									value: g.id,
								}))}
							/>
						</Form.Item>

						{/* 每个群组的分类选择 */}
						{selectedGroups.map((gid) => {
							const g = groups.find((x) => x.id === gid);
							const cats = categories[gid] ?? [];
							return (
								<Form.Item
									key={gid}
									name={`category_${gid}`}
									label={`「${g?.name ?? gid}」分类`}
								>
									<Select
										placeholder="选择分类（可选，默认归入默认分类）"
										allowClear
										options={cats.map((c) => ({
											label: c.name + (c.is_default ? "（默认）" : ""),
											value: c.id,
										}))}
									/>
								</Form.Item>
							);
						})}

						<Form.Item name="description" label="描述（可选）">
							<TextArea
								placeholder="为这批文件添加描述，最多 500 字"
								maxLength={500}
								showCount
								rows={3}
							/>
						</Form.Item>
					</Form>
				</Card>

				{/* 上传按钮 */}
				<button
					onClick={handleUpload}
					disabled={uploading || files.length === 0}
					style={{
						width: "100%",
						padding: "14px 0",
						borderRadius: 12,
						border: "none",
						cursor: uploading || files.length === 0 ? "not-allowed" : "pointer",
						background:
							uploading || files.length === 0
								? "rgba(124,58,237,0.3)"
								: "linear-gradient(135deg,#7c3aed,#6366f1)",
						color: "#fff",
						fontSize: 15,
						fontWeight: 600,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
						transition: "all 0.18s ease",
						boxShadow:
							uploading || files.length === 0
								? "none"
								: "0 4px 16px rgba(124,58,237,0.35)",
					}}
				>
					<CloudUpload size={18} />
					{uploading
						? "上传中…"
						: files.length === 0
							? "请先添加文件"
							: `开始上传 ${pendingCount} 个文件`}
				</button>

				{/* 上传说明 */}
				<div
					style={{
						padding: "12px 14px",
						borderRadius: 10,
						background: "rgba(124,58,237,0.05)",
						border: "1px solid rgba(124,58,237,0.1)",
					}}
				>
					<p
						style={{
							margin: "0 0 6px",
							fontSize: 12,
							fontWeight: 600,
							color: "#7c3aed",
						}}
					>
						上传规则
					</p>
					{[
						"图片：JPG / PNG / WebP / HEIC，≤ 50MB",
						"视频：MP4 / MOV，≤ 1GB，≤ 30min",
						"单次最多 50 个文件",
						"多群组上传 = 每群组独立副本",
					].map((tip) => (
						<p
							key={tip}
							style={{
								margin: "3px 0 0",
								fontSize: 11,
								color: "#8b83b4",
								paddingLeft: 10,
								position: "relative",
							}}
						>
							<span
								style={{
									position: "absolute",
									left: 0,
									top: "50%",
									transform: "translateY(-50%)",
									width: 4,
									height: 4,
									borderRadius: "50%",
									background: "#c4b5fd",
								}}
							/>
							{tip}
						</p>
					))}
				</div>
			</div>
		</div>
	);
}
