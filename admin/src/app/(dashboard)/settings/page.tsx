"use client";

import { api } from "@/lib/api";
import {
	Button,
	Card,
	Form,
	Input,
	InputNumber,
	message,
	Spin,
	Switch,
} from "antd";
import { Globe, Lock, Save, Sliders } from "lucide-react";
import { useEffect, useState } from "react";

interface SystemSettings {
	platform_name?: string;
	max_image_size_mb?: number;
	max_video_size_mb?: number;
	max_batch_upload?: number;
	min_password_length?: number;
	announcement?: string;
	registration_enabled?: boolean;
	captcha_required?: boolean;
}

export default function Settings() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<SystemSettings>({});

	useEffect(() => {
		api
			.get("/system/settings")
			.then((res) => {
				const s = res as unknown as SystemSettings;
				setSettings(s);
				form.setFieldsValue(s);
			})
			.catch(() => {
				// 可能尚未配置，使用默认值
				form.setFieldsValue({
					platform_name: "时空万象",
					max_image_size_mb: 50,
					max_video_size_mb: 1024,
					max_batch_upload: 50,
					min_password_length: 8,
					registration_enabled: true,
					captcha_required: true,
				});
			})
			.finally(() => setLoading(false));
	}, [form]);

	const handleSave = async () => {
		const values = await form.validateFields().catch(() => null);
		if (!values) return;
		setSaving(true);
		try {
			await api.patch("/system/settings", values);
			message.success("设置已保存");
			setSettings(values);
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "保存失败");
		} finally {
			setSaving(false);
		}
	};

	const SectionCard = ({
		title,
		icon,
		children,
	}: {
		title: string;
		icon: React.ReactNode;
		children: React.ReactNode;
	}) => (
		<Card
			style={{ borderRadius: 14, marginBottom: 16 }}
			title={
				<span
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						color: "#1e1b4b",
						fontSize: 14,
					}}
				>
					{icon}
					{title}
				</span>
			}
		>
			{children}
		</Card>
	);

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: 60 }}>
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div style={{ maxWidth: 680 }}>
			<Form form={form} layout="vertical">
				{/* 平台基础信息 */}
				<SectionCard
					title="平台基础信息"
					icon={<Globe size={15} color="#7c3aed" />}
				>
					<Form.Item
						name="platform_name"
						label="平台名称"
						rules={[{ required: true, message: "请输入平台名称" }]}
					>
						<Input placeholder="时空万象" maxLength={50} />
					</Form.Item>
					<Form.Item
						name="announcement"
						label="平台公告（在 APP 消息中心展示）"
					>
						<Input.TextArea
							placeholder="可在此输入全平台公告内容…"
							maxLength={500}
							showCount
							rows={3}
						/>
					</Form.Item>
				</SectionCard>

				{/* 上传限制 */}
				<SectionCard
					title="上传限制"
					icon={<Sliders size={15} color="#d97706" />}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "0 20px",
						}}
					>
						<Form.Item
							name="max_image_size_mb"
							label="图片最大尺寸（MB）"
							rules={[{ required: true }]}
						>
							<InputNumber min={1} max={200} style={{ width: "100%" }} />
						</Form.Item>
						<Form.Item
							name="max_video_size_mb"
							label="视频最大尺寸（MB）"
							rules={[{ required: true }]}
						>
							<InputNumber min={1} max={5120} style={{ width: "100%" }} />
						</Form.Item>
						<Form.Item
							name="max_batch_upload"
							label="单次批量上传上限（个）"
							rules={[{ required: true }]}
						>
							<InputNumber min={1} max={100} style={{ width: "100%" }} />
						</Form.Item>
					</div>
				</SectionCard>

				{/* 账号安全 */}
				<SectionCard title="账号安全" icon={<Lock size={15} color="#0ea5e9" />}>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "0 20px",
						}}
					>
						<Form.Item
							name="min_password_length"
							label="密码最短位数"
							rules={[{ required: true }]}
						>
							<InputNumber min={6} max={32} style={{ width: "100%" }} />
						</Form.Item>
					</div>
					<Form.Item
						name="registration_enabled"
						label="开放注册"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item
						name="captcha_required"
						label="登录时强制验证码"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</SectionCard>

				{/* 保存按钮 */}
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<Button
						type="primary"
						icon={<Save size={14} />}
						loading={saving}
						onClick={handleSave}
						style={{
							background: "linear-gradient(135deg,#7c3aed,#6366f1)",
							border: "none",
							borderRadius: 10,
							height: 40,
							paddingInline: 24,
							boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
							display: "flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						保存设置
					</Button>
				</div>
			</Form>
		</div>
	);
}
