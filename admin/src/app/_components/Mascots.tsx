"use client";
import { useEffect, useRef, useState } from "react";

const TEXT_FIELDS = new Set(["username", "captcha"]);
const PASS_FIELDS = new Set(["password", "confirm"]);

const EASE = "cubic-bezier(0.34, 1.4, 0.5, 1)";
const TR = `transform 0.5s ${EASE}`;

export default function Mascots({
	fieldKey,
	mouse,
}: {
	fieldKey: string | null;
	mouse: { x: number; y: number };
}) {
	const [peekActive, setPeekActive] = useState(false);
	const prevKeyRef = useRef<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		const prev = prevKeyRef.current;
		prevKeyRef.current = fieldKey;
		if (!fieldKey || !TEXT_FIELDS.has(fieldKey)) {
			setPeekActive(false);
			return;
		}
		if (prev && TEXT_FIELDS.has(prev) && prev !== fieldKey) {
			setPeekActive(false);
			timerRef.current = setTimeout(() => setPeekActive(true), 300);
		} else {
			setPeekActive(true);
		}
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [fieldKey]);

	const isText = peekActive;
	const isPass = !!fieldKey && PASS_FIELDS.has(fieldKey);

	const ceX = isText ? 9 : isPass ? 0 : mouse.x * 4;
	const ceY = isText ? 3 : isPass ? -8 : mouse.y * 3;
	const peX = isText ? 4 : isPass ? 0 : mouse.x * 3;
	const peY = isText ? 1 : isPass ? -4 : mouse.y * 2.2;

	const leanX = isText ? 32 : isPass ? -6 : mouse.x * 2;
	const leanY = isText ? -24 : isPass ? 7 : 0;
	const leanR = isText ? 8 : isPass ? -2 : 0;
	const shadowScale = isText ? 0.62 : 1;

	const browY = isPass ? -9 : isText ? -4 : 0;
	const catSquint = isPass;
	const charSurprise = isText;
	const whisker = isText ? 7 : 0;

	const move = (x: number, y: number) => ({
		transform: `translate(${x}px, ${y}px)`,
		transition: TR,
	});

	return (
		<div className="stage">
			{/* ══════════════════════════════════════
			    橘色小人  —— 鸡蛋/水滴形
			    参照图片2：下宽上窄的椭圆蛋形
			══════════════════════════════════════ */}
			<svg viewBox="0 0 80 96" className="ch ch-orange">
				{/* 地面阴影 */}
				<ellipse cx="40" cy="92" rx="24" ry="4" fill="rgba(0,0,0,0.20)" />
				{/* 蛋形身体：下半圆润，上半略收 */}
				<path
					d="M40,8 C18,8 8,28 8,54 C8,76 22,88 40,88 C58,88 72,76 72,54 C72,28 62,8 40,8 Z"
					fill="#F4823E"
				/>
				{/* 眼白 */}
				<circle cx="28" cy="46" r="9" fill="#fff" />
				<circle cx="52" cy="46" r="9" fill="#fff" />
				{/* 瞳孔 */}
				<g style={move(peX, peY)}>
					<circle cx="28" cy="46" r="4" fill="#1A1A1A" />
					<circle cx="52" cy="46" r="4" fill="#1A1A1A" />
					<circle cx="30" cy="44" r="1.5" fill="#fff" />
					<circle cx="54" cy="44" r="1.5" fill="#fff" />
				</g>
				{/* 嘴 */}
				{charSurprise ? (
					<ellipse cx="40" cy="66" rx="5.5" ry="7" fill="#C05A1F" />
				) : (
					<path
						d="M32,64 Q40,71 48,64"
						fill="none"
						stroke="#fff"
						strokeWidth="2.4"
						strokeLinecap="round"
					/>
				)}
			</svg>

			{/* ══════════════════════════════════════
			    紫色小人  —— 窄高胶囊形
			    参照图片2：细长的药丸/手指形状
			══════════════════════════════════════ */}
			<svg viewBox="0 0 48 112" className="ch ch-purple">
				<ellipse cx="24" cy="108" rx="17" ry="4" fill="rgba(0,0,0,0.20)" />
				<rect x="6" y="6" width="36" height="100" rx="18" fill="#7A5BD6" />
				{/* 眼白 */}
				<circle cx="16" cy="36" r="7.5" fill="#fff" />
				<circle cx="32" cy="36" r="7.5" fill="#fff" />
				{/* 瞳孔 */}
				<g style={move(peX, peY)}>
					<circle cx="16" cy="36" r="3.5" fill="#1A1A1A" />
					<circle cx="32" cy="36" r="3.5" fill="#1A1A1A" />
					<circle cx="17.5" cy="34.5" r="1.3" fill="#fff" />
					<circle cx="33.5" cy="34.5" r="1.3" fill="#fff" />
				</g>
				{/* 嘴 */}
				{charSurprise ? (
					<ellipse cx="24" cy="54" rx="4.5" ry="6" fill="#5A3DA8" />
				) : (
					<path
						d="M18,52 Q24,58 30,52"
						fill="none"
						stroke="#fff"
						strokeWidth="2.2"
						strokeLinecap="round"
					/>
				)}
			</svg>

			{/* ══════════════════════════════════════
			    黑色小人  —— 矮小胶囊形
			    参照图片2：比紫色更矮更窄
			══════════════════════════════════════ */}
			<svg viewBox="0 0 44 90" className="ch ch-black">
				<ellipse cx="22" cy="86" rx="14" ry="4" fill="rgba(0,0,0,0.20)" />
				<rect x="6" y="10" width="32" height="72" rx="16" fill="#2C2C34" />
				{/* 眼白 */}
				<circle cx="15" cy="34" r="6.5" fill="#fff" />
				<circle cx="29" cy="34" r="6.5" fill="#fff" />
				{/* 瞳孔 */}
				<g style={move(peX, peY)}>
					<circle cx="15" cy="34" r="3" fill="#1A1A1A" />
					<circle cx="29" cy="34" r="3" fill="#1A1A1A" />
					<circle cx="16.2" cy="32.8" r="1.1" fill="#fff" />
					<circle cx="30.2" cy="32.8" r="1.1" fill="#fff" />
				</g>
				{/* 嘴 */}
				{charSurprise ? (
					<ellipse cx="22" cy="50" rx="4" ry="5.5" fill="#444" />
				) : (
					<path
						d="M16,48 Q22,54 28,48"
						fill="none"
						stroke="#fff"
						strokeWidth="2"
						strokeLinecap="round"
					/>
				)}
			</svg>

			{/* ══════════════════════════════════════
			    黄色小猫  —— 圆润团子猫
			══════════════════════════════════════ */}
			<svg viewBox="0 -40 340 380" className="cat">
				<defs>
					<radialGradient id="catBody" cx="48%" cy="36%" r="66%">
						<stop offset="0%" stopColor="#FFE87A" />
						<stop offset="55%" stopColor="#FFD24D" />
						<stop offset="100%" stopColor="#F9BE20" />
					</radialGradient>
					{/* 前爪专用稍暗渐变 */}
					<radialGradient id="pawGrad" cx="50%" cy="30%" r="70%">
						<stop offset="0%" stopColor="#FFCD3A" />
						<stop offset="100%" stopColor="#E8A000" />
					</radialGradient>
				</defs>

				{/* 地面阴影 */}
				<ellipse
					cx="154"
					cy="325"
					rx="130"
					ry="15"
					fill="rgba(0,0,0,0.18)"
					style={{
						transform: `scale(${shadowScale})`,
						transformOrigin: "154px 325px",
						transition: TR,
					}}
				/>

				{/* 整体探头 / 躲避 */}
				<g
					style={{
						transform: `translate(${leanX - 18}px,${leanY}px) rotate(${leanR}deg)`,
						transformOrigin: "170px 308px",
						transition: TR,
					}}
				>
					{/* 尾巴（身后右侧卷曲） */}
					<path
						d="M255,270 C320,260 328,188 286,174 C314,208 280,250 244,252 Z"
						fill="#F9BE20"
						stroke="#E8A800"
						strokeWidth="1.2"
					/>

					{/* ─── 前爪（坐姿，在身体前方、颜色比身体深一个色阶，确保可见） ─── */}
					{/* 左前爪 */}
					<circle cx="114" cy="315" r="26" fill="url(#pawGrad)" />
					<ellipse
						cx="103"
						cy="307"
						rx="6.5"
						ry="5"
						fill="#D4900A"
						opacity="0.6"
					/>
					<ellipse
						cx="114"
						cy="304"
						rx="6.5"
						ry="5"
						fill="#D4900A"
						opacity="0.6"
					/>
					<ellipse
						cx="125"
						cy="307"
						rx="6.5"
						ry="5"
						fill="#D4900A"
						opacity="0.6"
					/>
					{/* 右前爪 */}
					<circle cx="226" cy="315" r="26" fill="url(#pawGrad)" />
					<ellipse
						cx="215"
						cy="307"
						rx="6.5"
						ry="5"
						fill="#D4900A"
						opacity="0.6"
					/>
					<ellipse
						cx="226"
						cy="304"
						rx="6.5"
						ry="5"
						fill="#D4900A"
						opacity="0.6"
					/>
					<ellipse
						cx="237"
						cy="307"
						rx="6.5"
						ry="5"
						fill="#D4900A"
						opacity="0.6"
					/>

					{/* 身体（宽圆椭圆） */}
					<ellipse cx="170" cy="244" rx="118" ry="84" fill="url(#catBody)" />
					{/* 头（与身体融合） */}
					<circle cx="170" cy="134" r="88" fill="url(#catBody)" />
					{/* 肚皮高光 */}
					<ellipse
						cx="170"
						cy="258"
						rx="82"
						ry="62"
						fill="#FFF3B0"
						opacity="0.50"
					/>

					{/* 招手侧爪（左） */}
					<ellipse
						cx="62"
						cy="240"
						rx="18"
						ry="14"
						fill="#F9BE20"
						transform="rotate(-22 62 240)"
					/>

					{/* 耳朵（圆润） */}
					<path
						d="M110,80 C 94,42 116,24 146,52 C158,62 152,86 128,88 Z"
						fill="#F9BE20"
					/>
					<path
						d="M118,76 C 108,52 120,42 136,60 C144,68 139,82 126,82 Z"
						fill="#FF9E6A"
					/>
					<path
						d="M230,80 C 246,42 224,24 194,52 C182,62 188,86 212,88 Z"
						fill="#F9BE20"
					/>
					<path
						d="M222,76 C 232,52 220,42 204,60 C196,68 201,82 214,82 Z"
						fill="#FF9E6A"
					/>

					{/* 腮红 */}
					<ellipse
						cx="110"
						cy="154"
						rx="16"
						ry="11"
						fill="#FF9EAF"
						opacity="0.52"
					/>
					<ellipse
						cx="230"
						cy="154"
						rx="16"
						ry="11"
						fill="#FF9EAF"
						opacity="0.52"
					/>

					{/* 眉毛 */}
					<g style={{ transform: `translateY(${browY}px)`, transition: TR }}>
						<path
							d="M120,112 Q140,96 162,110"
							fill="none"
							stroke="#D9960A"
							strokeWidth="3.8"
							strokeLinecap="round"
						/>
						<path
							d="M178,110 Q200,96 220,112"
							fill="none"
							stroke="#D9960A"
							strokeWidth="3.8"
							strokeLinecap="round"
						/>
					</g>

					{/* 眼睛 */}
					{catSquint ? (
						<>
							<path
								d="M118,136 Q140,122 164,136"
								fill="none"
								stroke="#2A2A2A"
								strokeWidth="5.8"
								strokeLinecap="round"
							/>
							<path
								d="M176,136 Q200,122 222,136"
								fill="none"
								stroke="#2A2A2A"
								strokeWidth="5.8"
								strokeLinecap="round"
							/>
						</>
					) : (
						<>
							<ellipse cx="142" cy="138" rx="23" ry="26" fill="#fff" />
							<ellipse cx="198" cy="138" rx="23" ry="26" fill="#fff" />
							<g style={move(ceX, ceY)}>
								<circle cx="142" cy="140" r="12" fill="#2A2A2A" />
								<circle cx="198" cy="140" r="12" fill="#2A2A2A" />
								<circle cx="146" cy="135" r="4.5" fill="#fff" />
								<circle cx="202" cy="135" r="4.5" fill="#fff" />
								<circle cx="139" cy="144" r="2.4" fill="#fff" />
								<circle cx="195" cy="144" r="2.4" fill="#fff" />
							</g>
						</>
					)}

					{/* 鼻子 + 嘴 */}
					<path d="M161,164 L170,173 L179,164 Z" fill="#FF7A9C" />
					<path
						d="M152,175 Q170,185 188,175"
						fill="none"
						stroke="#C98A00"
						strokeWidth="2.6"
						strokeLinecap="round"
						opacity="0.65"
					/>

					{/* 胡须（偷看时张开） */}
					<g
						style={{
							transform: `rotate(${-whisker}deg)`,
							transformOrigin: "124px 164px",
							transition: TR,
						}}
						stroke="#E8C040"
						strokeWidth="2.2"
						strokeLinecap="round"
					>
						<line x1="68" y1="158" x2="124" y2="162" />
						<line x1="64" y1="170" x2="124" y2="170" />
						<line x1="68" y1="182" x2="124" y2="178" />
					</g>
					<g
						style={{
							transform: `rotate(${whisker}deg)`,
							transformOrigin: "216px 164px",
							transition: TR,
						}}
						stroke="#E8C040"
						strokeWidth="2.2"
						strokeLinecap="round"
					>
						<line x1="216" y1="162" x2="272" y2="158" />
						<line x1="216" y1="170" x2="276" y2="170" />
						<line x1="216" y1="178" x2="272" y2="182" />
					</g>
				</g>
			</svg>

			<style jsx>{`
				.stage {
					position: absolute;
					left: 0;
					right: 0;
					bottom: 26px;
					display: flex;
					align-items: flex-end;
					justify-content: center;
					gap: 8px;
					padding: 0 24px 0 54px;
					z-index: 4;
					pointer-events: none;
				}
				.stage :global(svg) {
					flex-shrink: 0;
					display: block;
				}
				.stage :global(.ch-orange) {
					width: 76px;
					height: 90px;
				}
				.stage :global(.ch-purple) {
					width: 46px;
					height: 106px;
				}
				.stage :global(.ch-black) {
					width: 42px;
					height: 86px;
					margin-right: 14px;
				}
				.stage :global(.cat) {
					width: 348px;
					height: 360px;
					margin-bottom: -8px;
				}
			`}</style>
		</div>
	);
}
