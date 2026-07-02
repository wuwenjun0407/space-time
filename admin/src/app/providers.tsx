"use client";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [qc] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
			}),
	);
	return (
		<AntdRegistry>
			<ConfigProvider
				locale={zhCN}
				theme={{
					algorithm: antdTheme.darkAlgorithm,
					token: { colorPrimary: "#6C63FF", borderRadius: 8 },
				}}
			>
				<QueryClientProvider client={qc}>{children}</QueryClientProvider>
			</ConfigProvider>
		</AntdRegistry>
	);
}
