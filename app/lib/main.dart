import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() => runApp(const ProviderScope(child: SpaceTimeApp()));

/// APP 占位：基础架构已就绪，五大 Tab（时光/空间/上传/回忆/我的）
/// 待管理端开发验证通过后正式开发。
class SpaceTimeApp extends StatelessWidget {
  const SpaceTimeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '时空万象',
      theme: ThemeData.dark(useMaterial3: true),
      home: const Scaffold(
        body: Center(child: Text('时空万象 · 一人一宇宙，一域一时光')),
      ),
    );
  }
}
