<div align="center">

<img src="https://github.com/user-attachments/assets/f28b8872-98c1-463e-b0cd-6c0207a6f51a" alt="WHA Spell Editor Icon" width="128" height="128" />

# WHA Spell Editor

一个简单易用的法术图形化创作工具。

A simple and easy-to-use visual spell creation tool.

[![Framework Wails](https://img.shields.io/badge/Built%20with-Wails-red)](https://wails.io/)
[![Go Version](https://img.shields.io/badge/Go-1.20+-00ADD8?logo=go)](https://golang.org/)
[![AI Vibecoded](https://img.shields.io/badge/Vibecoding-GLM--5.3--Flash-blue)](https://zhipuai.cn/)

</div>

---

## 简介 / Introduction

本项目是在 [DaviAMSilva/wha-spell-maker](https://github.com/DaviAMSilva/wha-spell-maker) 项目的基础上进行的二次开发与优化。
<br>本项目的核心目标是提供一个更加易于操作和直观的界面，用于创建和编辑法术。

This project is a secondary development and optimization based on [DaviAMSilva/wha-spell-maker](https://github.com/DaviAMSilva/wha-spell-maker).
<br>The core goal of this project is to provide a more intuitive and user-friendly interface for creating and editing spells.

---

## 关于与功能限制 / About & Limitations

<br>**不支持导入自定义贴图**：无法导入本地第三方图片文件作为贴图或图标。
<br>No custom texture import: Cannot import local third-party image files as textures or icons.

<br>**不支持任意颜色选择**：取消了调色盘，仅仅支持 16 种预设颜色。
<br>No arbitrary color picker: The color wheel is removed, supporting only 16 preset colors.

<br>如果您需要导入自定义贴图或需要任意颜色选择等高级功能，建议直接使用原版项目：[wha-spell-maker](https://github.com/DaviAMSilva/wha-spell-maker)。
<br>If you require advanced features such as importing custom textures or picking arbitrary colors, please use the original project directly: [wha-spell-maker](https://github.com/DaviAMSilva/wha-spell-maker).

---

## 界面 / Screenshots

<img width="1346" height="853" alt="image" src="https://github.com/user-attachments/assets/44c02d33-77a9-4e3e-bc23-fa011ddd792b" />

---

## 本地构建指南 / Local Build Guide

若您需要在本地进行编译与构建，请遵循以下步骤：
<br>If you need to compile and build locally, please follow these steps:

### 1. 前置准备（必需） / Prerequisites (Required)

由于资源文件未包含在仓库中，在本地构建前，必须手动复制相关资源：
<br>Since asset files are not included in this repository, you must manually copy the required assets before building locally:

1. 克隆或下载原项目 [wha-spell-maker](https://github.com/DaviAMSilva/wha-spell-maker)。
  <br>Clone or download the original project [wha-spell-maker](https://github.com/DaviAMSilva/wha-spell-maker).

2. 找到原项目中的 `src/assets/symbols` 文件夹。
  <br>Locate the `src/assets/symbols` folder in the original project.

3. 将该文件夹复制并粘贴至本项目的 `src/assets/` 目录下（最终路径应为 `src/assets/symbols`）。
   <br>Copy and paste the folder into `src/assets/` in this project (the final path should be `src/assets/symbols`).

### 2. 环境要求 / System Requirements

- [Go](https://golang.org/) (建议 1.20 或更高版本 / 1.20 or higher recommended)
- [Node.js](https://nodejs.org/)
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)

### 3. 构建步骤 / Build Steps

1. 克隆本项目
    <br>Clone this repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/WHA_spell_editor.git](https://github.com/YOUR_USERNAME/WHA_spell_editor.git)
   cd WHA_spell_editor
   ```
2. 确保已按上方步骤复制好 src/assets/symbols 资源文件夹。
    <br>Ensure that the src/assets/symbols folder has been copied as instructed above.

3. 以开发模式运行 
    <br>Run in development mode：
   ```
   wails dev
   ```
4. 打包构建可执行文件 
    <br>Build the executable file：
   ```
   wails build
   ```
