import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
	title: "时空万象 · 管理端",
	description: "一人一宇宙，一域一时光，珍藏全家所有岁月影像",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="zh-CN">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
