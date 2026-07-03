"use client";

import { api } from "@/lib/api";
import type { Group, Member } from "@/types";
import {
	Avatar,
	Button,
	Card,
	Col,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Row,
	Select,
	Spin,
	Tag,
} from "antd";
import { Crown, Edit, Plus, UserMinus, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function GroupPage() {
	const [groups, setGroups] = useState<Group[]>([]);
	const [activeGroup, setActiveGroup] = useState<Group | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [loadingGroups, setLoadingGroups] = useState(true);
	const [loadingMembers, setLoadingMembers] = useState(false);
	const [addModal, setAddModal] = useState(false);
	const [editModal, setEditModal] = useState(false);
	const [searchUser, setSearchUser] = useState("");
	const [searchResults, setSearchResults] = useState<
		{ id: string; username: string; nickname?: string }[]
	>([]);
	const [addForm] = Form.useForm();
	const [editForm] = Form.useForm();
	const [saving, setSaving] = useState(false);

	// 加载群组列表
	useEffect(() => {
		api
			.get("/groups")
			.then((res) => {
				const grps = res as unknown as Group[];
				setGroups(grps);
				// 优先选主理人群组
				const myGroup = grps.find((g) => g.role === "owner") ?? grps[0];
				if (myGroup) setActiveGroup(myGroup);
			})
			.catch(() => setGroups([]))
			.finally(() => setLoadingGroups(false));
	}, []);

	// 加载成员列表
	useEffect(() => {
		if (!activeGroup) return;
		setLoadingMembers(true);
		api
			.get(`/groups/${activeGroup.id}/members`)
			.then((res) => setMembers(res as unknown as Member[]))
			.catch(() => setMembers([]))
			.finally(() => setLoadingMembers(false));
	}, [activeGroup]);

	// 搜索用户
	const handleSearch = async (q: string) => {
		setSearchUser(q);
		if (q.trim().length < 1) {
			setSearchResults([]);
			return;
		}
		try {
			const res = await api.get(
				`/users/search?q=${encodeURIComponent(q)}&limit=10`,
			);
			setSearchResults(
				res as unknown as { id: string; username: string; nickname?: string }[],
			);
		} catch {
			setSearchResults([]);
		}
	};

	// 添加成员
	const handleAddMember = async () => {
		const values = await addForm.validateFields().catch(() => null);
		if (!values || !activeGroup) return;
		setSaving(true);
		try {
			await api.post(`/groups/${activeGroup.id}/members`, {
				user_id: values.user_id,
				role: values.role ?? "member",
			});
			message.success("成员已添加");
			setAddModal(false);
			addForm.resetFields();
			setSearchResults([]);
			// 刷新成员列表
			const res = await api.get(`/groups/${activeGroup.id}/members`);
			setMembers(res as unknown as Member[]);
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "添加失败");
		} finally {
			setSaving(false);
		}
	};

	// 移除成员
	const handleRemoveMember = async (userId: string) => {
		if (!activeGroup) return;
		try {
			await api.delete(`/groups/${activeGroup.id}/members/${userId}`);
			message.success("已移除成员");
			setMembers((prev) => prev.filter((m) => m.user_id !== userId));
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "操作失败");
		}
	};

	// 编辑群组信息
	const handleEditGroup = async () => {
		const values = await editForm.validateFields().catch(() => null);
		if (!values || !activeGroup) return;
		setSaving(true);
		try {
			await api.put(`/groups/${activeGroup.id}`, values);
			message.success("群组信息已更新");
			setEditModal(false);
			setGroups((prev) =>
				prev.map((g) =>
					g.id === activeGroup.id ? { ...g, name: values.name } : g,
				),
			);
			setActiveGroup((prev) => (prev ? { ...prev, name: values.name } : prev));
		} catch (e: unknown) {
			const err = e as { message?: string };
			message.error(err?.message ?? "更新失败");
		} finally {
			setSaving(false);
		}
	};

	const isOwner = activeGroup?.role === "owner";

	return (
		<div>
			{loadingGroups ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin />
				</div>
			) : (
				<Row gutter={[16, 16]}>
					{/* 左：群组列表 */}
					<Col xs={24} sm={8} lg={6}>
						<Card
							title={<span style={{ color: "#1e1b4b" }}>我的群组</span>}
							style={{ borderRadius: 14 }}
						>
							<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
								{groups.map((g) => (
									<button
										key={g.id}
										onClick={() => setActiveGroup(g)}
										style={{
											width: "100%",
											padding: "10px 12px",
											borderRadius: 10,
											background:
												activeGroup?.id === g.id
													? "linear-gradient(90deg,rgba(124,58,237,0.1),rgba(99,102,241,0.05))"
													: "transparent",
											border:
												activeGroup?.id === g.id
													? "1px solid rgba(124,58,237,0.2)"
													: "1px solid transparent",
											cursor: "pointer",
											textAlign: "left",
											transition: "all 0.18s ease",
											display: "flex",
											alignItems: "center",
											gap: 8,
										}}
										onMouseEnter={(e) => {
											if (activeGroup?.id !== g.id)
												(e.currentTarget as HTMLElement).style.background =
													"rgba(124,58,237,0.04)";
										}}
										onMouseLeave={(e) => {
											if (activeGroup?.id !== g.id)
												(e.currentTarget as HTMLElement).style.background =
													"transparent";
										}}
									>
										<div
											style={{
												width: 32,
												height: 32,
												borderRadius: 8,
												background:
													g.role === "owner"
														? "linear-gradient(135deg,#f59e0b,#f97316)"
														: "linear-gradient(135deg,#0ea5e9,#06b6d4)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												flexShrink: 0,
											}}
										>
											{g.role === "owner" ? (
												<Crown size={14} color="#fff" />
											) : (
												<Users size={14} color="#fff" />
											)}
										</div>
										<div style={{ minWidth: 0 }}>
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
												{g.name}
											</p>
											<p style={{ margin: 0, fontSize: 11, color: "#8b83b4" }}>
												{g.role === "owner" ? "主理人" : "成员"}
												{g.is_active && (
													<span
														style={{
															marginLeft: 4,
															color: "#10b981",
															fontWeight: 500,
														}}
													>
														· 生效中
													</span>
												)}
											</p>
										</div>
									</button>
								))}
							</div>
						</Card>
					</Col>

					{/* 右：成员管理 */}
					<Col xs={24} sm={16} lg={18}>
						{activeGroup ? (
							<Card
								title={
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 10,
										}}
									>
										<span style={{ color: "#1e1b4b" }}>
											{activeGroup.name} · 成员管理
										</span>
										<Tag
											color={activeGroup.role === "owner" ? "orange" : "blue"}
										>
											{activeGroup.role === "owner" ? "主理人" : "成员"}
										</Tag>
									</div>
								}
								style={{ borderRadius: 14 }}
								extra={
									isOwner && (
										<div style={{ display: "flex", gap: 8 }}>
											<Button
												size="small"
												icon={<Edit size={13} />}
												style={{ borderRadius: 7 }}
												onClick={() => {
													editForm.setFieldsValue({
														name: activeGroup.name,
													});
													setEditModal(true);
												}}
											>
												编辑群组
											</Button>
											<Button
												size="small"
												type="primary"
												icon={<Plus size={13} />}
												style={{
													borderRadius: 7,
													background: "linear-gradient(135deg,#7c3aed,#6366f1)",
													border: "none",
												}}
												onClick={() => setAddModal(true)}
											>
												添加成员
											</Button>
										</div>
									)
								}
							>
								{loadingMembers ? (
									<div style={{ textAlign: "center", padding: 40 }}>
										<Spin />
									</div>
								) : (
									<div
										style={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fill, minmax(220px, 1fr))",
											gap: 10,
										}}
									>
										{members.map((m) => (
											<div
												key={m.user_id}
												style={{
													padding: "12px 14px",
													borderRadius: 12,
													background:
														m.role === "owner"
															? "rgba(217,119,6,0.05)"
															: "rgba(124,58,237,0.04)",
													border: `1px solid ${
														m.role === "owner"
															? "rgba(217,119,6,0.15)"
															: "rgba(124,58,237,0.08)"
													}`,
													display: "flex",
													alignItems: "center",
													gap: 10,
												}}
											>
												<Avatar
													size={38}
													style={{
														background:
															m.role === "owner"
																? "linear-gradient(135deg,#f59e0b,#f97316)"
																: "linear-gradient(135deg,#8b5cf6,#6366f1)",
														fontSize: 15,
														fontWeight: 600,
														flexShrink: 0,
													}}
												>
													{(m.nickname?.[0] || m.username[0])?.toUpperCase()}
												</Avatar>
												<div style={{ flex: 1, minWidth: 0 }}>
													<p
														style={{
															margin: 0,
															fontSize: 13,
															fontWeight: 600,
															color: "#1e1b4b",
														}}
													>
														{m.nickname || m.username}
													</p>
													<p
														style={{
															margin: 0,
															fontSize: 11,
															color: "#8b83b4",
														}}
													>
														@{m.username}
													</p>
												</div>
												<div
													style={{
														display: "flex",
														flexDirection: "column",
														alignItems: "flex-end",
														gap: 4,
													}}
												>
													<Tag
														color={m.role === "owner" ? "orange" : "purple"}
														style={{ fontSize: 10, margin: 0 }}
													>
														{m.role === "owner" ? "主理人" : "成员"}
													</Tag>
													{isOwner && m.role !== "owner" && (
														<Popconfirm
															title="确认移除该成员？"
															description="已上传的文件不受影响。"
															onConfirm={() => handleRemoveMember(m.user_id)}
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
																	display: "flex",
																	alignItems: "center",
																	gap: 3,
																	fontSize: 11,
																	padding: 0,
																}}
															>
																<UserMinus size={11} />
																移除
															</button>
														</Popconfirm>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</Card>
						) : (
							<Card style={{ borderRadius: 14 }}>
								<div style={{ textAlign: "center", padding: 40 }}>
									<Users
										size={40}
										color="#c4b5fd"
										style={{ margin: "0 auto 12px" }}
									/>
									<p style={{ color: "#8b83b4" }}>请选择一个群组查看成员</p>
								</div>
							</Card>
						)}
					</Col>
				</Row>
			)}

			{/* 添加成员 Modal */}
			<Modal
				title="添加成员"
				open={addModal}
				onOk={handleAddMember}
				onCancel={() => {
					setAddModal(false);
					addForm.resetFields();
					setSearchResults([]);
				}}
				confirmLoading={saving}
				okText="确认添加"
				cancelText="取消"
				destroyOnClose
			>
				<Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="user_id"
						label="搜索用户"
						rules={[{ required: true, message: "请选择要添加的用户" }]}
					>
						<Select
							showSearch
							placeholder="输入用户名搜索…"
							filterOption={false}
							onSearch={handleSearch}
							options={searchResults.map((u) => ({
								label: (
									<span>
										{u.nickname || u.username}
										<span style={{ color: "#8b83b4", fontSize: 11 }}>
											{" "}
											@{u.username}
										</span>
									</span>
								),
								value: u.id,
							}))}
							notFoundContent={
								searchUser ? "未找到该用户，请确认用户名" : "输入用户名开始搜索"
							}
						/>
					</Form.Item>
					<Form.Item name="role" label="角色" initialValue="member">
						<Select
							options={[
								{ label: "普通成员", value: "member" },
								{ label: "主理人（慎选）", value: "owner" },
							]}
						/>
					</Form.Item>
					<p style={{ fontSize: 12, color: "#8b83b4", margin: 0 }}>
						被添加的用户将直接加入群组，无需接受，APP 端将收到通知。
					</p>
				</Form>
			</Modal>

			{/* 编辑群组 Modal */}
			<Modal
				title="编辑群组信息"
				open={editModal}
				onOk={handleEditGroup}
				onCancel={() => setEditModal(false)}
				confirmLoading={saving}
				okText="保存"
				cancelText="取消"
				destroyOnClose
			>
				<Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="name"
						label="群组名称"
						rules={[
							{ required: true, message: "请输入群组名称" },
							{ max: 50, message: "最多 50 字符" },
						]}
					>
						<Input placeholder="群组名称" maxLength={50} showCount />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
