"use client";

import { api } from "@/lib/api";
import { Button, Card, DatePicker, Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { RefreshCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface LogEntry {
	id: string;
	action: string;
	target_type?: string;
	target_id?: string;
	operator_username?: string;
	operator_nickname?: string;
	ip?: string;
	detail?: string;
	created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
	login: { label: "登录", color: "blue" },
	logout: { label: "退出", color: "default" },
	upload_file: { label: "上传文件", color: "cyan" },
	delete_file: { label: "删除文件", color: "red" },
	create_space: { label: "创建空间", color: "purple" },
	update_space: { label: "编辑空间", color: "purple" },
	delete_space: { label: "删除空间", color: "red" },
	add_member: { label: "添加成员", color: "green" },
	remove_member: { label: "移除成员", color: "orange" },
	ban_user: { label: "封禁用户", color: "red" },
	unban_user: { label: "解封用户", color: "green" },
	reset_password: { label: "重置密码", color: "orange" },
	create_style: { label: "创建风格", color: "geekblue" },
	create_theme: { label: "创建主题", color: "geekblue" },
	update_settings: { label: "修改设置", color: "volcano" },
};

const { RangePicker } = DatePicker;

export default function LogsPage() {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [filterAction, setFilterAction] = useState<string>("");
	const [searchKw, setSearchKw] = useState<string>("");
	const [dateRange, setDateRange] = useState<[string, string] | null>(null);

	const fetchLogs = (pg = 1) => {
		setLoading(true);
		const params = new URLSearchParams({
			page: String(pg),
			page_size: "30",
		});
		if (filterAction) params.set("action", filterAction);
		if (searchKw) params.set("q", searchKw);
		if (dateRange) {
			params.set("start", dateRange[0]);
			params.set("end", dateRange[1]);
		}

		api
			.get(`/logs?${params}`)
			.then((res) => {
				const r = res as unknown as {
					items: LogEntry[];
					total: number;
				};
				setLogs(r.items ?? (Array.isArray(res) ? (res as LogEntry[]) : []));
				setTotal(r.total ?? 0);
				setPage(pg);
			})
			.catch(() => setLogs([]))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchLogs(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterAction, searchKw, dateRange]);

	const columns: ColumnsType<LogEntry> = [
		{
			title: "时间",
			dataIndex: "created_at",
			width: 160,
			render: (v: string) => (
				<span style={{ fontSize: 12, color: "#8b83b4" }}>
					{dayjs(v).format("YYYY-MM-DD HH:mm:ss")}
				</span>
			),
		},
		{
			title: "操作类型",
			dataIndex: "action",
			width: 120,
			render: (action: string) => {
				const cfg = ACTION_LABELS[action] ?? {
					label: action,
					color: "default",
				};
				return <Tag color={cfg.color}>{cfg.label}</Tag>;
			},
		},
		{
			title: "操作人",
			key: "operator",
			width: 140,
			render: (_, record) => (
				<span style={{ fontSize: 13, color: "#1e1b4b" }}>
					{record.operator_nickname || record.operator_username || "—"}
					{record.operator_username && (
						<span style={{ color: "#8b83b4", fontSize: 11 }}>
							{" "}
							@{record.operator_username}
						</span>
					)}
				</span>
			),
		},
		{
			title: "IP 地址",
			dataIndex: "ip",
			width: 130,
			render: (v?: string) => (
				<span
					style={{ fontSize: 12, fontFamily: "monospace", color: "#4c4571" }}
				>
					{v ?? "—"}
				</span>
			),
		},
		{
			title: "对象类型",
			dataIndex: "target_type",
			width: 100,
			render: (v?: string) =>
				v ? (
					<Tag color="default" style={{ fontSize: 10 }}>
						{v}
					</Tag>
				) : (
					"—"
				),
		},
		{
			title: "详情",
			dataIndex: "detail",
			ellipsis: true,
			render: (v?: string) => (
				<span style={{ fontSize: 12, color: "#8b83b4" }}>{v ?? "—"}</span>
			),
		},
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			{/* 筛选栏 */}
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
						placeholder="搜索操作人用户名…"
						value={searchKw}
						onChange={(e) => setSearchKw(e.target.value)}
						style={{ width: 200, borderRadius: 8 }}
						allowClear
					/>
					<Select
						value={filterAction}
						onChange={setFilterAction}
						style={{ width: 150 }}
						allowClear
						placeholder="操作类型"
						options={Object.entries(ACTION_LABELS).map(([k, v]) => ({
							label: v.label,
							value: k,
						}))}
					/>
					<RangePicker
						style={{ borderRadius: 8 }}
						onChange={(_, dateStrings) => {
							if (dateStrings[0] && dateStrings[1]) {
								setDateRange([dateStrings[0], dateStrings[1]]);
							} else {
								setDateRange(null);
							}
						}}
					/>
					<Button
						icon={<RefreshCcw size={13} />}
						onClick={() => fetchLogs(1)}
						style={{ borderRadius: 8 }}
					>
						刷新
					</Button>
					<p style={{ margin: "0 0 0 auto", fontSize: 12, color: "#8b83b4" }}>
						共 {total} 条日志
					</p>
				</div>
			</Card>

			{/* 日志表格 */}
			<Card style={{ borderRadius: 14 }}>
				<Table
					rowKey="id"
					columns={columns}
					dataSource={logs}
					loading={loading}
					pagination={{
						current: page,
						total,
						pageSize: 30,
						onChange: fetchLogs,
						showSizeChanger: false,
						showTotal: (t) => `共 ${t} 条`,
					}}
					scroll={{ x: 800 }}
					size="small"
				/>
			</Card>

			<div
				style={{
					padding: "10px 14px",
					borderRadius: 10,
					background: "rgba(124,58,237,0.04)",
					border: "1px solid rgba(124,58,237,0.08)",
					fontSize: 12,
					color: "#8b83b4",
				}}
			>
				操作日志永久留存，记录平台内所有关键操作行为，包括登录/上传/删除/成员管理/皮肤配置等。
			</div>
		</div>
	);
}
