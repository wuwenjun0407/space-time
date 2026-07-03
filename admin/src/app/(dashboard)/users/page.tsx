"use client";

import { api } from "@/lib/api";
import type { UserMe } from "@/types";
import {
	Avatar,
	Badge,
	Button,
	Card,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Select,
	Space,
	Table,
	Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Ban, CheckCircle, KeyRound, RefreshCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminUser extends UserMe {
	created_at: string;
	last_login_at?: string;
	banned_until?: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [searchKw, setSearchKw] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [filterRole, setFilterRole] = useState<string>("");
	const [resetPwdModal, setResetPwdModal] = useState(false);
	const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
	const [resetForm] = Form.useForm();
	const [saving, setSaving] = useState(false);

	const fetchUsers = (pg = 1) => {
		setLoading(true);
		const params = new URLSearchParams({
			page: String(pg),
			page_size: "20",
		});
		if (searchKw) params.set("q", searchKw);
		if (filterStatus) params.set("status", filterStatus);
		if (filterRole) params.set("role", filterRole);

		api
			.get(`/users?${params}`)
			.then((res) => {
				const r = res as unknown as {
					items: AdminUser[];
					total: number;
				};
				setUsers(r.items ?? []);
				setTotal(r.total ?? 0);
				setPage(pg);
			})
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchUsers(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchKw, filterStatus, filterRole]);

	const handleBan = async (user: AdminUser, ban: boolean) => {
		try {
			await api.patch(`/users/${user.id}`, {
				status: ban ? "banned" : "active",
			});
			message.success(ban ? "已封禁该用户" : "已解封该用户");
			fetchUsers(page);
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "操作失败");
		}
	};

	const handleResetPwd = async () => {
		const values = await resetForm.validateFields().catch(() => null);
		if (!values || !targetUser) return;
		setSaving(true);
		try {
			await api.post(`/users/${targetUser.id}/reset-password`, {
				new_password: values.new_password,
			});
			message.success("密码已重置");
			setResetPwdModal(false);
			resetForm.resetFields();
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "操作失败");
		} finally {
			setSaving(false);
		}
	};

	const columns: ColumnsType<AdminUser> = [
		{
			title: "用户",
			key: "user",
			render: (_, record) => (
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<Avatar
						size={36}
						src={record.avatar_url}
						style={{
							background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
							fontWeight: 600,
							flexShrink: 0,
						}}
					>
						{(record.nickname?.[0] || record.username[0])?.toUpperCase()}
					</Avatar>
					<div>
						<p
							style={{
								margin: 0,
								fontSize: 13,
								fontWeight: 600,
								color: "#1e1b4b",
							}}
						>
							{record.nickname || record.username}
						</p>
						<p style={{ margin: 0, fontSize: 11, color: "#8b83b4" }}>
							@{record.username}
						</p>
					</div>
				</div>
			),
		},
		{
			title: "角色",
			dataIndex: "role",
			render: (role: string) => (
				<Tag color={role === "superadmin" ? "purple" : "blue"}>
					{role === "superadmin" ? "超级管理员" : "普通用户"}
				</Tag>
			),
		},
		{
			title: "状态",
			dataIndex: "status",
			render: (status: string) => (
				<Badge
					status={
						status === "active"
							? "success"
							: status === "banned"
								? "error"
								: "default"
					}
					text={
						status === "active"
							? "正常"
							: status === "banned"
								? "已封禁"
								: status
					}
				/>
			),
		},
		{
			title: "注册时间",
			dataIndex: "created_at",
			render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD") : "—"),
		},
		{
			title: "最近登录",
			dataIndex: "last_login_at",
			render: (v?: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—"),
		},
		{
			title: "操作",
			key: "actions",
			render: (_, record) => (
				<Space size={4}>
					{record.status === "banned" ? (
						<Popconfirm
							title={`确认解封用户 @${record.username}？`}
							onConfirm={() => handleBan(record, false)}
							okText="确认"
							cancelText="取消"
						>
							<Button
								size="small"
								style={{
									borderColor: "rgba(16,185,129,0.3)",
									color: "#10b981",
									borderRadius: 7,
								}}
								icon={<CheckCircle size={12} />}
							>
								解封
							</Button>
						</Popconfirm>
					) : (
						record.role !== "superadmin" && (
							<Popconfirm
								title={`确认封禁用户 @${record.username}？`}
								description="封禁后该用户将无法登录。"
								onConfirm={() => handleBan(record, true)}
								okText="确认封禁"
								cancelText="取消"
								okButtonProps={{ danger: true }}
							>
								<Button
									size="small"
									danger
									style={{ borderRadius: 7 }}
									icon={<Ban size={12} />}
								>
									封禁
								</Button>
							</Popconfirm>
						)
					)}
					<Button
						size="small"
						style={{
							borderColor: "rgba(124,58,237,0.2)",
							color: "#7c3aed",
							borderRadius: 7,
						}}
						icon={<KeyRound size={12} />}
						onClick={() => {
							setTargetUser(record);
							resetForm.resetFields();
							setResetPwdModal(true);
						}}
					>
						重置密码
					</Button>
				</Space>
			),
		},
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			{/* 工具栏 */}
			<Card style={{ borderRadius: 14 }}>
				<div
					style={{
						display: "flex",
						gap: 10,
						flexWrap: "wrap",
						alignItems: "center",
					}}
				>
					<Input
						prefix={<Search size={13} color="#9ca3af" />}
						placeholder="搜索用户名/昵称…"
						value={searchKw}
						onChange={(e) => setSearchKw(e.target.value)}
						style={{ width: 220, borderRadius: 8 }}
						allowClear
					/>
					<Select
						value={filterRole}
						onChange={setFilterRole}
						style={{ width: 130 }}
						allowClear
						placeholder="角色"
						options={[
							{ label: "普通用户", value: "user" },
							{ label: "超级管理员", value: "superadmin" },
						]}
					/>
					<Select
						value={filterStatus}
						onChange={setFilterStatus}
						style={{ width: 120 }}
						allowClear
						placeholder="状态"
						options={[
							{ label: "正常", value: "active" },
							{ label: "已封禁", value: "banned" },
						]}
					/>
					<Button
						icon={<RefreshCcw size={13} />}
						onClick={() => fetchUsers(1)}
						style={{ borderRadius: 8 }}
					>
						刷新
					</Button>
					<p
						style={{
							margin: "0 0 0 auto",
							fontSize: 12,
							color: "#8b83b4",
						}}
					>
						共 {total} 个用户
					</p>
				</div>
			</Card>

			{/* 用户表格 */}
			<Card style={{ borderRadius: 14 }}>
				<Table
					rowKey="id"
					columns={columns}
					dataSource={users}
					loading={loading}
					pagination={{
						current: page,
						total,
						pageSize: 20,
						onChange: fetchUsers,
						showSizeChanger: false,
						showTotal: (t) => `共 ${t} 条`,
					}}
					scroll={{ x: 700 }}
					rowClassName={(record) =>
						record.status === "banned" ? "opacity-60" : ""
					}
				/>
			</Card>

			{/* 重置密码 Modal */}
			<Modal
				title={`重置密码 — @${targetUser?.username ?? ""}`}
				open={resetPwdModal}
				onOk={handleResetPwd}
				onCancel={() => setResetPwdModal(false)}
				confirmLoading={saving}
				okText="确认重置"
				cancelText="取消"
				destroyOnClose
			>
				<Form form={resetForm} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="new_password"
						label="新密码"
						rules={[
							{ required: true, message: "请输入新密码" },
							{ min: 8, message: "密码至少 8 位" },
							{ max: 32, message: "密码最多 32 位" },
							{
								pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
								message: "密码须含字母和数字",
							},
						]}
					>
						<Input.Password placeholder="8~32 位，须包含字母和数字" />
					</Form.Item>
					<Form.Item
						name="confirm_password"
						label="确认密码"
						rules={[{ required: true, message: "请再次输入" }]}
					>
						<Input.Password placeholder="再次输入新密码" />
					</Form.Item>
					<p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>
						⚠ 重置后用户将需要使用新密码重新登录
					</p>
				</Form>
			</Modal>
		</div>
	);
}
