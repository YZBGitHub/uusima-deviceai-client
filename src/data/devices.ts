export interface DeviceSpecItem {
  label: string;
  value: string;
}

export interface DeviceCommandItem {
  command: string;
  description: string;
}

export interface DeviceAgent {
  id: string;
  title: string;
  subtitle: string;
  publisherType: "system" | "user";
  model: string;
  vendor: string;
  category: string;
  image: string;
  imageFrameStyle: "workbench" | "module";
  summary: string;
  protocols: string[];
  defaultParams: string;
  specs: DeviceSpecItem[];
  quickCommands: DeviceCommandItem[];
  starterPrompts: string[];
  systemContext: string;
}

export const DEVICES: DeviceAgent[] = [
  {
    id: "ai-training-platform",
    title: "人工智能前端设备应用实训平台智能体",
    subtitle: "人工智能前端设备应用实训平台智能体",
    publisherType: "system",
    model: "AI-EDGE-LAB-V2",
    vendor: "实训平台",
    category: "边缘视觉与控制实训",
    image: "/src/assets/images/device_ai_training_platform_1794841684025.jpg",
    imageFrameStyle: "workbench",
    summary:
      "集成工业视觉双相机、嵌入式AI边缘计算主机、触控人机交互屏及物理旋钮/拨动开关矩阵，用于图像识别、传感器采集与机电联动实训。",
    protocols: ["RTSP", "HTTP API", "MQTT", "Modbus RTU", "USB-UVC"],
    defaultParams: "192.168.1.100 · RS485 115200 8N1",
    specs: [
      { label: "算力核心", value: "边缘AI推理主机 (NPU 6 TOPS)" },
      { label: "视觉采集", value: "双路工业千兆网/USB视觉相机" },
      { label: "交互面板", value: "10.1寸电容触控屏 + 实体旋钮开关组" },
      { label: "通信接口", value: "2×RJ45千兆网口、RS485、HDMI、USB-C" },
      { label: "供电要求", value: "AC 220V 转 DC 24V 工业稳压电源" },
    ],
    quickCommands: [
      { command: "python3 vision_infer.py --cam 0", description: "启动1号工业相机实时目标检测推理" },
      { command: "systemctl status edge-agent", description: "检查实训平台边缘推理服务运行状态" },
      { command: "v4l2-ctl --list-devices", description: "枚举当前已挂载的USB视觉采集设备" },
    ],
    starterPrompts: [
      "双路工业相机采集不到图像如何排查？",
      "如何通过Python读取前端旋钮和开关状态？",
      "生成实训平台视觉识别结果联动MQTT上报代码",
      "实训平台常见上电自检与网络配置步骤",
    ],
    systemContext:
      "设备为「人工智能前端设备应用实训平台」，包含双路视觉相机、触控屏、物理开关旋钮组及RS485/以太网接口，常用于高校及实训室AI边缘计算与工业物联网联合实验。",
  },
  {
    id: "usr-io424t",
    title: "四通道数字网络 IO 控制器",
    subtitle: "适用于有人IO424通道数字网络 IO 控制器",
    publisherType: "system",
    model: "USR-IO424T",
    vendor: "有人物联网 (USR)",
    category: "数字量网络IO",
    image: "/src/assets/images/device_io_controller_1794841684403.jpg",
    imageFrameStyle: "module",
    summary:
      "工业级4路开关量输入(DI)与4路继电器输出(DO)网络IO控制器，支持以太网与RS485双通道控制，原生支持Modbus TCP/RTU及主动上报。",
    protocols: ["Modbus TCP", "Modbus RTU", "TCP Client/Server", "MQTT"],
    defaultParams: "192.168.0.7:502 · 从站地址 1",
    specs: [
      { label: "数字输入 (DI)", value: "4路光电隔离输入 (支持干/湿节点)" },
      { label: "继电器输出 (DO)", value: "4路常开/常闭触点 (5A 250VAC/30VDC)" },
      { label: "通信接口", value: "1×RJ45 (10/100M) + 1×RS485" },
      { label: "工作电压", value: "DC 12V ~ 24V (防反接保护)" },
      { label: "默认网络参数", value: "IP 192.168.0.7 · 端口 502 · 站号 1" },
    ],
    quickCommands: [
      { command: "01 05 00 00 FF 00 8C 3A", description: "Modbus RTU 吸合第1路继电器 (DO1 ON)" },
      { command: "01 05 00 00 00 00 CD CA", description: "Modbus RTU 断开第1路继电器 (DO1 OFF)" },
      { command: "01 02 00 00 00 04 79 C9", description: "Modbus RTU 读取4路开关量输入状态 (DI1-DI4)" },
    ],
    starterPrompts: [
      "列出 USR-IO424T 的 DI/DO 寄存器地址表",
      "给出 Python Modbus TCP 控制4路继电器示例代码",
      "如何配置 DI 输入变化时主动上报服务器？",
      "继电器接线负载与干湿节点如何正确接线？",
    ],
    systemContext:
      "设备型号为有人 USR-IO424T 四通道数字网络 IO 控制器（4路DI光电隔离输入、4路继电器输出，支持Modbus TCP/RTU、RS485与RJ45以太网，默认IP 192.168.0.7，端口502，从站地址1）。",
  },
  {
    id: "center-gateway",
    title: "中心网关智能体",
    subtitle: "适用于新大陆中心网关设备",
    publisherType: "system",
    model: "NL-GW-CENTER",
    vendor: "新大陆 (Newland)",
    category: "物联网中心网关",
    image: "/src/assets/images/device_center_gateway_1794841682971.jpg",
    imageFrameStyle: "module",
    summary:
      "面向智慧园区与实训平台的中心汇聚网关，具备双频无线天线、多路LAN口及RS485工业总线接口，负责传感节点汇聚与云端协议转发。",
    protocols: ["MQTT", "ZigBee / Wi-Fi", "Modbus", "HTTP/TCP"],
    defaultParams: "192.168.1.1 · RS485 9600 8N1",
    specs: [
      { label: "无线能力", value: "双外置SMA天线 (Wi-Fi / ZigBee / 2.4G)" },
      { label: "有线网口", value: "4×RJ45 LAN/WAN 自适应百兆网口" },
      { label: "工业总线", value: "2×RS485 (A/B, Y/Z) 端子接口" },
      { label: "供电规格", value: "DC 12V ~ 48V 宽压输入" },
      { label: "核心职责", value: "多协议传感汇聚、边缘规则联动与上云" },
    ],
    quickCommands: [
      { command: "ping 192.168.1.1", description: "测试中心网关管理网口连通性" },
      { command: "mosquitto_sub -h 192.168.1.1 -t 'gw/#' -v", description: "订阅中心网关本地MQTT传感主题" },
      { command: "netstat -tulnp | grep 1883", description: "核查网关MQTT Broker端口监听状态" },
    ],
    starterPrompts: [
      "新大陆中心网关如何配置传感器节点入网？",
      "RS485 下挂设备数据如何转发至云平台 MQTT？",
      "双天线无线信号弱或掉线如何排查？",
      "生成中心网关 JSON 上行数据解析示例",
    ],
    systemContext:
      "设备为新大陆物联网中心网关，配备双天线、多路以太网口及RS485总线接口，负责本地传感器节点汇聚、ZigBee/Wi-Fi组网以及MQTT/TCP数据上云。",
  },
  {
    id: "ecu-1251",
    title: "ECU-1251研华工业通讯网关智能体",
    subtitle: "研华工业通讯网关",
    publisherType: "system",
    model: "ECU-1251",
    vendor: "研华科技 (Advantech)",
    category: "工业边缘通讯网关",
    image: "/src/assets/images/device_advantech_ecu1251_1794841685573.jpg",
    imageFrameStyle: "module",
    summary:
      "研华 DIN 导轨式 ARM 架构工业通讯网关，内置 EdgeLink 边缘软件平台，支持双网口隔离、双串口通信及丰富工业PLC协议转换。",
    protocols: ["Modbus", "OPC UA", "IEC-60870-5-104", "MQTT", "BACnet"],
    defaultParams: "LAN1 DHCP · LAN2 192.168.2.1",
    specs: [
      { label: "处理器平台", value: "RISC Cortex-A8 工业级低功耗核心" },
      { label: "网络接口", value: "2×10/100M 以太网口 (独立网段)" },
      { label: "串口与IO", value: "2×隔离RS-232/485 + DI/DO端子" },
      { label: "安装与供电", value: "DIN导轨安装 · DC 10V ~ 30V" },
      { label: "软件平台", value: "Advantech EdgeLink / Linux SDK" },
    ],
    quickCommands: [
      { command: "EdgeLink Studio -> Scan Gateway", description: "通过EdgeLink Studio扫描发现局域网ECU-1251" },
      { command: "cat /proc/net/dev", description: "查看LAN1/LAN2双网口收发数据包统计" },
      { command: "dmesg | grep ttyO", description: "检查COM1/COM2串口驱动设备节点映射" },
    ],
    starterPrompts: [
      "ECU-1251 如何使用 EdgeLink 采集 Modbus PLC 并转发 OPC UA？",
      "LAN1 和 LAN2 双网口隔离配置注意事项",
      "COM1/COM2 的 RS-232 与 RS-485 引脚定义",
      "网关断线重连与本地断点续传如何启用？",
    ],
    systemContext:
      "设备为研华 Advantech ECU-1251 工业通讯网关（DIN导轨安装，双以太网口LAN1/LAN2，隔离RS-232/485串口COM1/COM2，运行EdgeLink边缘软件，支持Modbus、OPC UA、IEC104、MQTT协议转换）。",
  },
  {
    id: "usr-m100",
    title: "USR-M100 有人DTU智能体",
    subtitle: "AI硬件智能体-USR-M100 有人4G DTU",
    publisherType: "user",
    model: "USR-M100",
    vendor: "有人物联网 (USR)",
    category: "4G 边缘网关与IO DTU",
    image: "/src/assets/images/device_usr_m100_dtu_1794841684451.jpg",
    imageFrameStyle: "module",
    summary:
      "集成 4G LTE 蜂窝通信、双以太网口、RS485 及板载 AI/DI/DO 的导轨式智能边缘网关，支持边缘采集运算与有人云/第三方MQTT对接。",
    protocols: ["4G LTE Cat.1/4", "MQTT", "Modbus RTU/TCP", "JSON上报"],
    defaultParams: "192.168.1.1 · 115200 8N1",
    specs: [
      { label: "蜂窝网络", value: "全网通 4G LTE + 双SMA天线" },
      { label: "有线接口", value: "2×RJ45以太网口 + RS485串口" },
      { label: "板载IO", value: "2×DI + 2×DO + 2×AI(4-20mA/0-10V)" },
      { label: "扩展能力", value: "侧面级联扩展IO模块 + TF卡存储" },
      { label: "工作电源", value: "DC 9V ~ 36V 导轨工业电源" },
    ],
    quickCommands: [
      { command: "AT+CSQ", description: "查询当前4G基站信号强度 (RSSI)" },
      { command: "AT+MQTTCFG?", description: "读取当前MQTT服务器地址与ClientID配置" },
      { command: "AT+SOCKA?", description: "查询Socket A透传通道连接参数" },
    ],
    starterPrompts: [
      "USR-M100 如何配置接入自定义 MQTT Broker？",
      "板载 AI 模拟量采集 4-20mA 传感器如何接线与换算？",
      "4G 无法注册网络或 SIM 卡不识别如何排查？",
      "配置边缘采集 Modbus 轮询并以 JSON 上报的步骤",
    ],
    systemContext:
      "设备为有人 USR-M100 4G 工业边缘物联网网关/DTU（支持4G LTE、双网口、RS485、自带2DI/2DO/2AI接口、支持Modbus网关与MQTT JSON上云、MicroSD存储与IO级联扩展）。",
  },
  {
    id: "lora-terminal",
    title: "LORA数传终端智能体",
    subtitle: "设备智能体-LORA终端",
    publisherType: "user",
    model: "USR-LG220-L / LT",
    vendor: "LoRa 无线数传终端",
    category: "LoRa 远距离数传",
    image: "/src/assets/images/device_lora_terminal_1794841685891.jpg",
    imageFrameStyle: "module",
    summary:
      "工业级远距离低功耗 LoRa 无线数传终端，支持 RS485/DI/DO 接口与定点/广播/中继多模式传输，适用于无布线厂区与农田传感器远传。",
    protocols: ["LoRa 433/470/868MHz", "AT指令", "Modbus透传", "定点通信"],
    defaultParams: "470MHz · 9600 8N1 · 信道 0",
    specs: [
      { label: "工作频段", value: "410~525MHz / 868~915MHz (可调信道)" },
      { label: "发射功率", value: "最大 +22dBm (空旷视距可达 3~5km)" },
      { label: "串口与IO", value: "RS485 (A/B) + 开关量DI/DO继电器端子" },
      { label: "工作模式", value: "透明传输 / 定点传输 / 主从轮询 / 中继" },
      { label: "供电电压", value: "DC 9V ~ 36V" },
    ],
    quickCommands: [
      { command: "+++", description: "进入LoRa终端AT指令配置模式（注意前后停顿）" },
      { command: "AT+SPD=10", description: "设置LoRa空中速率等级（速率越低距离越远）" },
      { command: "AT+CH=23", description: "设置通信信道号（主从两端须保持一致）" },
    ],
    starterPrompts: [
      "两台 LoRa 终端通信不通，必须检查哪几个参数？",
      "空中速率 (SF/BW) 与传输距离、功耗如何权衡？",
      "演示 LoRa 定点传输模式下的数据帧前缀格式",
      "如何用 +++ 进入 AT 配置模式并保存重启？",
    ],
    systemContext:
      "设备为工业 LoRa 无线数传终端（支持433/470MHz或868/915MHz频段、RS485/DI/DO接口、SMA天线接口、透明传输与定点传输、AT指令配置信道/速率/网络ID）。",
  },
  {
    id: "usr-tcp232-410s",
    title: "串口服务器智能体",
    subtitle: "设备智能体-串口终端（USR-TCP232-410s)",
    publisherType: "user",
    model: "USR-TCP232-410s",
    vendor: "有人物联网 (USR)",
    category: "双串口联网服务器",
    image: "/src/assets/images/device_serial_server_1794841685409.jpg",
    imageFrameStyle: "module",
    summary:
      "双串口 RS232 + RS485 转以太网工业串口服务器，基于 Cortex-M4 内核，支持双向透明传输、Modbus RTU 转 Modbus TCP 及虚拟串口。",
    protocols: ["TCP Server/Client", "UDP", "Modbus网关", "HTTPD Client", "虚拟串口"],
    defaultParams: "192.168.0.7 · 端口 23/26 · 115200 8N1",
    specs: [
      { label: "串口通道", value: "1×RS232 (DB9公头) + 1×RS485 (端子)" },
      { label: "以太网口", value: "1×RJ45 10/100M (Auto-MDIX)" },
      { label: "工作模式", value: "TCP Server / TCP Client / UDP / HTTPD" },
      { label: "默认管理页", value: "http://192.168.0.7 (账号/密码: admin)" },
      { label: "供电规格", value: "DC 5V ~ 36V (圆口 + 绿端子双供电)" },
    ],
    quickCommands: [
      { command: "AT+UART=115200,8,1,NONE,NFC", description: "设置串口波特率115200、8数据位、无校验" },
      { command: "AT+SOCK=TCPC,192.168.0.100,8234", description: "配置工作模式为TCP Client并指向目标IP端口" },
      { command: "AT+MODBUS=1", description: "开启Modbus RTU转Modbus TCP存储型/透传网关" },
    ],
    starterPrompts: [
      "USR-TCP232-410s 如何把 RS485 仪表转为 Modbus TCP？",
      "RS232 (DB9) 与 RS485 同时使用时的接线引脚说明",
      "Web网页管理端进不去或忘记IP地址怎么重置？",
      "生成 Python Socket 连接串口服务器读写数据示例",
    ],
    systemContext:
      "设备型号为有人 USR-TCP232-410s 工业双串口服务器（同时支持1路DB9 RS232和1路端子RS485并发工作，默认IP 192.168.0.7，端口23/26，支持TCP/UDP/HTTPD Client、Modbus RTU转TCP、虚拟串口VCOM及DC 5-36V宽压供电）。",
  },
  {
    id: "siemens-s7-1200-plc",
    title: "S7-1200 工业PLC智能体",
    subtitle: "西门子 SIMATIC S7-1200 (CPU 1214C) 控制器",
    publisherType: "system",
    model: "CPU 1214C DC/DC/DC",
    vendor: "西门子 (Siemens)",
    category: "可编程逻辑控制器",
    image: "/src/assets/images/device_plc_controller_1794842986635.jpg",
    imageFrameStyle: "module",
    summary:
      "主流紧凑型工业可编程逻辑控制器，集成14路DI/10路DQ与2路模拟量输入，支持 PROFINET、Modbus TCP 与 S7 通信协议。",
    protocols: ["PROFINET", "S7 Protocol", "Modbus TCP", "OPC UA"],
    defaultParams: "192.168.0.1 · Port 102 · Slot 1",
    specs: [
      { label: "集成I/O", value: "14×DI 24VDC / 10×DQ / 2×AI (0-10V)" },
      { label: "通信接口", value: "1×RJ45 PROFINET (支持扩展CM串口模块)" },
      { label: "存储容量", value: "100KB 工作内存 + 4MB 装载内存" },
      { label: "供电要求", value: "DC 20.4V ~ 28.8V" },
      { label: "编程环境", value: "TIA Portal V16+ / Snap7 通信库" },
    ],
    quickCommands: [
      { command: "client.connect('192.168.0.1', 0, 1)", description: "Python snap7 建立与 S7-1200 的以太网连接" },
      { command: "client.db_read(1, 0, 16)", description: "读取 DB1 数据块前 16 个字节寄存器" },
      { command: "MB_SERVER (PORT=502)", description: "启用 PLC 内置 Modbus TCP 从站功能块" },
    ],
    starterPrompts: [
      "Python 如何使用 snap7 读取 S7-1200 的 DB 块数据？",
      "TIA Portal 中如何开启 PUT/GET 与取消优化的块访问？",
      "S7-1200 作为 Modbus TCP Server 如何映射保持寄存器？",
      "PLC RUN/STOP 与 ERROR 红灯闪烁常见故障排查",
    ],
    systemContext:
      "设备为西门子 SIMATIC S7-1200 (CPU 1214C DC/DC/DC) PLC，支持 PROFINET、S7 协议 (端口102, 机架0槽号1) 以及 Modbus TCP / OPC UA 工业通信。",
  },
  {
    id: "rs485-th-transmitter",
    title: "RS485 温湿度变送器智能体",
    subtitle: "工业壁挂式带屏温湿度传感器 (HT-485-M)",
    publisherType: "system",
    model: "HT-485-M",
    vendor: "环境感知终端",
    category: "环境传感采集终端",
    image: "/src/assets/images/device_temp_humidity_sensor_1794842984078.jpg",
    imageFrameStyle: "module",
    summary:
      "工业防尘防水壁挂式高精度数字温湿度变送器，带本地段码液晶显示与按键地址配置，支持标准 Modbus RTU RS485 总线接入。",
    protocols: ["Modbus RTU", "RS485"],
    defaultParams: "地址 1 · 9600 8N1",
    specs: [
      { label: "测量范围", value: "温度 -40~80℃ (±0.3℃) · 湿度 0~100%RH" },
      { label: "通信接口", value: "RS485 两线制 (A+/B-) 光电隔离" },
      { label: "协议格式", value: "标准 Modbus RTU (功能码 03/06)" },
      { label: "供电规格", value: "DC 9V ~ 24V 宽压供电" },
      { label: "默认寄存器", value: "0x0000 湿度(×0.1) · 0x0001 温度(×0.1)" },
    ],
    quickCommands: [
      { command: "01 03 00 00 00 02 C4 0B", description: "读取 1 号站实时湿度与温度寄存器" },
      { command: "01 06 07 D0 00 02 09 46", description: "修改设备从站地址为 2 (寄存器 0x07D0)" },
      { command: "01 06 07 D1 00 02 58 86", description: "修改串口波特率为 9600 bps" },
    ],
    starterPrompts: [
      "温湿度数值返回 0xFF9C（负温度补码）怎么换算？",
      "一条 RS485 总线挂接多台温湿度传感器如何改地址？",
      "给出 Python pyserial 读取并解析温湿度的代码",
      "RS485 接线接反或未接终端电阻时的通信现象",
    ],
    systemContext:
      "设备为工业壁挂式 RS485 温湿度变送器 HT-485-M，遵循标准 Modbus RTU 协议，默认站号1、波特率9600 8N1，寄存器0x0000为湿度(放大10倍)、0x0001为温度(放大10倍有符号补码)。",
  },
  {
    id: "robustel-4g-router",
    title: "工业 4G 全网通路由器智能体",
    subtitle: "双天线多网口工业级 LTE 无线路由器",
    publisherType: "system",
    model: "R4G-LTE-PRO",
    vendor: "工业网络路由",
    category: "蜂窝无线路由网关",
    image: "/src/assets/images/device_industrial_4g_router_1794842984870.jpg",
    imageFrameStyle: "module",
    summary:
      "全金属防尘散热工业 4G LTE 无线路由器，提供 4 路百兆/千兆 LAN/WAN 网口、双外置高增益天线及硬件看门狗，支持 VPN 与双卡备份。",
    protocols: ["4G LTE", "Wi-Fi", "OpenVPN / IPsec", "SNMP", "DHCP"],
    defaultParams: "192.168.0.1 · Web 管理端",
    specs: [
      { label: "蜂窝接入", value: "全网通 4G LTE Cat.4 (主集+分集双天线)" },
      { label: "以太网口", value: "3×LAN + 1×WAN/LAN 自适应网口" },
      { label: "安全隧道", value: "IPsec VPN / OpenVPN / GRE / L2TP" },
      { label: "可靠性", value: "ICMP 链路保活检测 + 硬件看门狗自复位" },
      { label: "供电电压", value: "DC 9V ~ 36V 宽压输入" },
    ],
    quickCommands: [
      { command: "ping -I wwan0 223.5.5.5", description: "测试 4G 蜂窝接口公网连通性" },
      { command: "route -n", description: "查看路由器当前默认网关与子网路由表" },
      { command: "ipsec statusall", description: "查看 IPsec VPN 加密隧道协商状态" },
    ],
    starterPrompts: [
      "如何配置工业 4G 路由器与总部的 OpenVPN 组网？",
      "WAN 有线网络与 4G 蜂窝链路双备份切换配置方法",
      "下挂 PLC 设备如何通过路由器端口映射实现远程调试？",
      "4G 信号满格但无法拨号上网的 APN 参数检查步骤",
    ],
    systemContext:
      "设备为工业 4G 全网通无线路由器，具备 4 路以太网口、双 SMA 天线、SIM 卡槽，支持 WAN/4G 链路切换、VPN 隧道、端口映射及链路保活。",
  },
  {
    id: "edge-ai-400-box",
    title: "无风扇边缘AI计算盒智能体",
    subtitle: "工业视觉与推理计算主机 (EDGE-AI 400)",
    publisherType: "system",
    model: "EDGE-AI 400",
    vendor: "边缘智能计算",
    category: "边缘AI推理主机",
    image: "/src/assets/images/device_edge_ai_box_1794842986040.jpg",
    imageFrameStyle: "module",
    summary:
      "铝合金鳍片式无风扇工业边缘 AI 计算盒，内置深度学习推理加速卡，支持双路 HDMI 显示、双千兆网口及 Docker 容器化模型部署。",
    protocols: ["ONNX / TensorRT", "Docker", "RTSP", "MQTT", "gRPC"],
    defaultParams: "192.168.1.200 · SSH 22",
    specs: [
      { label: "AI 算力", value: "INT8 21 TOPS 深度学习推理加速" },
      { label: "内存存储", value: "16GB LPDDR5 + 256GB NVMe SSD" },
      { label: "高速接口", value: "2×千兆网口 + 2×HDMI + 4×USB 3.0" },
      { label: "无线扩展", value: "Wi-Fi 6E 双天线接口" },
      { label: "运行环境", value: "Ubuntu 22.04 LTS + Docker + CUDA/TensorRT" },
    ],
    quickCommands: [
      { command: "docker ps -a", description: "查看边缘盒上运行的 AI 视觉检测容器" },
      { command: "tegrastats --interval 1000", description: "实时监控 NPU/GPU 占用率与芯片温度" },
      { command: "ffmpeg -i rtsp://192.168.1.64/stream1 -f null -", description: "测试拉取现场网络摄像机 RTSP 视频流" },
    ],
    starterPrompts: [
      "如何在 EDGE-AI 400 上部署 YOLOv8 TensorRT 推理容器？",
      "多路 RTSP 相机推流延迟高、掉帧如何调优？",
      "编写检测告警后通过 MQTT 联动声光报警器的脚本",
      "无风扇边缘盒高温降频排查与散热安装建议",
    ],
    systemContext:
      "设备为无风扇工业边缘 AI 计算盒 EDGE-AI 400，运行 Ubuntu Linux 与 Docker，支持 TensorRT/ONNX 视觉模型推理、双千兆网口拉取 RTSP 视频流并通过 MQTT/HTTP 上报告警。",
  },
  {
    id: "din-da16a-analog",
    title: "八通道模拟量采集模块智能体",
    subtitle: "DIN-DA16A 4-20mA 工业数据采集模块",
    publisherType: "system",
    model: "DIN-DA16A",
    vendor: "工业测控模块",
    category: "模拟量信号采集",
    image: "/src/assets/images/device_analog_io_module_1794842986024.jpg",
    imageFrameStyle: "module",
    summary:
      "导轨式 8 通道隔离型 4-20mA 模拟量采集模块，支持 12/16 位高精度 ADC 采样，通过 RS485 Modbus RTU 接入压力、液位、流量等变送器。",
    protocols: ["Modbus RTU", "RS485"],
    defaultParams: "地址 1 · 9600 8N1",
    specs: [
      { label: "模拟量输入", value: "8路差分 4-20mA (独立通道指示灯)" },
      { label: "采样精度", value: "12-bit/16-bit 隔离 ADC (精度 ±0.1%)" },
      { label: "通信接口", value: "RS485 (DB9 + 螺丝端子)" },
      { label: "供电电压", value: "DC 24V 工业导轨电源" },
      { label: "量程映射", value: "原始码值 0~4095 / 电流 4000~20000 uA" },
    ],
    quickCommands: [
      { command: "01 04 00 00 00 08 F1 CC", description: "Modbus 04 功能码批量读取 CH1~CH8 采集值" },
      { command: "01 03 00 10 00 01 85 CF", description: "读取模块当前滤波采样周期设置" },
      { command: "01 06 00 20 00 02 08 01", description: "调整模块 RS485 波特率配置参数" },
    ],
    starterPrompts: [
      "两线制与四线制 4-20mA 压力变送器如何接到 DIN-DA16A？",
      "如何将 4-20mA 寄存器码值线性换算为 0~1.6MPa 压力值？",
      "读取数值抖动较大时如何开启均值滤波与屏蔽接地？",
      "生成 Python 定时轮询 8 通道模拟量并检测断线（<3.8mA）代码",
    ],
    systemContext:
      "设备为 DIN-DA16A 八通道 4-20mA 模拟量数据采集模块，DIN 导轨安装，24V DC 供电，通过 RS485 Modbus RTU (功能码04/03) 上报 8 路模拟电流信号。",
  },
  {
    id: "lab-vision-qc-agent",
    title: "产线视觉质检实训智能体",
    subtitle: "用户自定义-双目缺陷检测与分拣实训台",
    publisherType: "user",
    model: "AI-QC-CUSTOM",
    vendor: "用户编排实训体",
    category: "自定义视觉质检",
    image: "/src/assets/images/device_ai_training_platform_1794841684025.jpg",
    imageFrameStyle: "workbench",
    summary:
      "基于前端实训平台二次编排的产线外观缺陷质检智能体，关联双相机定位标定参数、良品率统计与异常工位分拣逻辑。",
    protocols: ["HTTP REST", "MQTT", "Modbus TCP"],
    defaultParams: "192.168.1.105 · Topic /qc/result",
    specs: [
      { label: "应用模板", value: "PCB/工件表面缺陷与字符OCR识别" },
      { label: "触发方式", value: "光电传感器 DI 触发 / 定时连拍" },
      { label: "联动输出", value: "NG 踢料电磁阀 DO 控制 + 蜂鸣提示" },
      { label: "发布来源", value: "用户工作空间自定义发布" },
    ],
    quickCommands: [
      { command: "curl -X POST http://192.168.1.105:8080/api/inspect", description: "手动触发一次产线视觉检测抓拍推理" },
      { command: "mosquitto_pub -t '/qc/mode' -m 'auto'", description: "切换质检实训台至自动触发流水线模式" },
    ],
    starterPrompts: [
      "相机标定精度偏差导致定位不准如何重新校准？",
      "光照反光造成误检 NG 时光源和曝光参数怎么调？",
      "生成检测结果为 NG 时触发继电器延迟剔除的逻辑代码",
    ],
    systemContext:
      "这是用户基于人工智能前端设备实训平台自定义发布的「产线视觉质检实训智能体」，侧重于双目视觉定位、表面缺陷判定、光源曝光调优与 NG 分拣控制。",
  },
  {
    id: "smart-relay-lighting-agent",
    title: "智能教室照明控制智能体",
    subtitle: "用户发布-四路继电器时序与人体联动控制",
    publisherType: "user",
    model: "USR-IO424T-EDU",
    vendor: "用户自定义编排",
    category: "楼宇与实训室控制",
    image: "/src/assets/images/device_io_controller_1794841684403.jpg",
    imageFrameStyle: "module",
    summary:
      "用户基于 USR-IO424T 定制的实训室照明与门禁联动控制智能体，支持有人/无人 DI 状态触发与定时群控。",
    protocols: ["Modbus TCP", "MQTT"],
    defaultParams: "192.168.0.17:502 · 站号 1",
    specs: [
      { label: "控制回路", value: "DO1主灯 / DO2辅灯 / DO3空调 / DO4排风" },
      { label: "联动输入", value: "DI1人体红外 / DI2门磁 / DI3消防应急" },
      { label: "控制策略", value: "无人延时5分钟断电 + 一键全关模式" },
      { label: "发布来源", value: "用户工作空间自定义发布" },
    ],
    quickCommands: [
      { command: "00 01 00 00 00 06 01 0F 00 00 00 04 01 0F", description: "Modbus TCP 一次性开启全部4路照明与设备" },
      { command: "00 02 00 00 00 06 01 0F 00 00 00 04 01 00", description: "Modbus TCP 一键关闭全部4路继电器" },
    ],
    starterPrompts: [
      "如何配置继电器互锁或上电默认断开状态？",
      "人体传感器接入 DI1 后的延时消抖与自动关灯逻辑",
      "给出 Node.js 批量控制 4 路继电器全开全关代码",
    ],
    systemContext:
      "这是用户基于四通道数字网络 IO 控制器 (USR-IO424T) 自定义发布的「智能教室照明控制智能体」，用于实训室灯光、空调接触器及门磁红外传感联动控制。",
  },
  {
    id: "campus-env-gateway-agent",
    title: "智慧大棚环境汇聚智能体",
    subtitle: "用户发布-新大陆中心网关农业传感聚合",
    publisherType: "user",
    model: "NL-AGRI-GW",
    vendor: "用户自定义编排",
    category: "智慧农业物联网",
    image: "/src/assets/images/device_center_gateway_1794841682971.jpg",
    imageFrameStyle: "module",
    summary:
      "用户针对温室大棚场景发布的中心网关配置模板，整合空气温湿度、土壤墒情、光照度传感汇聚与自动卷帘/灌溉联动策略。",
    protocols: ["ZigBee", "MQTT", "Modbus RTU"],
    defaultParams: "192.168.1.1 · Topic /agri/telemetry",
    specs: [
      { label: "汇聚节点", value: "ZigBee 土壤传感器 + RS485 气象站" },
      { label: "上报频率", value: "每 30 秒聚合上报 1 次 JSON 遥测" },
      { label: "本地阈值", value: "温度 > 32℃ 自动打开通风扇" },
      { label: "发布来源", value: "用户工作空间自定义发布" },
    ],
    quickCommands: [
      { command: "mosquitto_sub -t '/agri/+/telemetry' -v", description: "实时查看智慧大棚所有节点上报数据" },
    ],
    starterPrompts: [
      "大棚断网时中心网关如何执行本地温度阈值联动？",
      "多个 ZigBee 节点同时上报丢包怎么调整采集周期？",
      "编写接收大棚 JSON 遥测并写入时序数据库的示例",
    ],
    systemContext:
      "这是用户基于新大陆中心网关自定义发布的「智慧大棚环境汇聚智能体」，用于农业温室传感数据汇聚与边缘阈值自动化控制。",
  },
  {
    id: "power-meter-edgelink-agent",
    title: "配电房能耗采集网关智能体",
    subtitle: "用户发布-ECU-1251 多表计 IEC104/OPCUA 转换",
    publisherType: "user",
    model: "ECU-1251-EMS",
    vendor: "用户自定义编排",
    category: "能源与电力监控",
    image: "/src/assets/images/device_advantech_ecu1251_1794841685573.jpg",
    imageFrameStyle: "module",
    summary:
      "用户基于研华 ECU-1251 编排的配电能耗数采智能体，支持多块 DLT645/Modbus 智能电表轮询并统一转换为 OPC UA 与 MQTT 上报。",
    protocols: ["DLT645-2007", "Modbus RTU", "OPC UA", "IEC-104"],
    defaultParams: "COM1 2400 8E1 · COM2 9600 8N1",
    specs: [
      { label: "接入表计", value: "最多 32 块 RS485 电力仪表级联" },
      { label: "采集指标", value: "三相电压、电流、有功功率、正向有功电能" },
      { label: "断网缓存", value: "本地断网补传缓存 7 天分钟级记录" },
      { label: "发布来源", value: "用户工作空间自定义发布" },
    ],
    quickCommands: [
      { command: "68 AA AA AA AA AA AA 68 11 04 33 33 34 33 AE 16", description: "DLT645-2007 读取正向有功总电能广播帧" },
    ],
    starterPrompts: [
      "DLT645-2007 电力仪表偶校验 (8E1) 与字节加 0x33 规则说明",
      "ECU-1251 单串口挂多块电表时轮询超时时间如何设定？",
      "如何将采集到的电表点位发布为 OPC UA 节点树？",
    ],
    systemContext:
      "这是用户基于研华 ECU-1251 工业通讯网关自定义发布的「配电房能耗采集网关智能体」，专注于 DLT645-2007/Modbus 电力仪表采集与 OPC UA/IEC-104 规约转换。",
  },
  {
    id: "coldchain-4g-monitor",
    title: "冷链车厢温控 DTU 智能体",
    subtitle: "用户发布-4G 移动监测与超温告警上报",
    publisherType: "user",
    model: "USR-M100-COLD",
    vendor: "用户自定义编排",
    category: "冷链移动监测",
    image: "/src/assets/images/device_usr_m100_dtu_1794841684451.jpg",
    imageFrameStyle: "module",
    summary:
      "面向冷链运输车厢的 4G DTU 监测智能体，通过 RS485 采集多点冷库探头温度及门磁开关状态，支持离线缓存与超温短信/MQTT告警。",
    protocols: ["4G LTE", "MQTT", "Modbus RTU"],
    defaultParams: "MQTT TLS · 采样周期 15s",
    specs: [
      { label: "车厢探头", value: "4 路 RS485 低温探头 (-30℃~+40℃)" },
      { label: "门磁检测", value: "DI1 车门开启告警 + DO1 声光警示" },
      { label: "存储策略", value: "TF 卡断网断点续传 (GSP冷链合规)" },
      { label: "发布来源", value: "用户工作空间自定义发布" },
    ],
    quickCommands: [
      { command: "AT+CREG?", description: "查询车载移动环境中 4G 网络注册漫游状态" },
    ],
    starterPrompts: [
      "车辆进入地下车库无信号时 TF 卡断点续传如何配置？",
      "冷链温度超过 8℃ 持续 3 分钟触发 DO 告警逻辑设置",
      "如何在 4G DTU 中设置心跳包保活时间节省流量？",
    ],
    systemContext:
      "这是用户基于 USR-M100 4G DTU 自定义发布的「冷链车厢温控 DTU 智能体」，负责冷链温度探头轮询、车门状态监测及离线断点续传。",
  },
  {
    id: "water-pump-lora-agent",
    title: "农田泵站 LoRa 远传智能体",
    subtitle: "用户发布-3公里无布线泵阀启停控制终端",
    publisherType: "user",
    model: "LORA-PUMP-01",
    vendor: "用户自定义编排",
    category: "无线远程泵控",
    image: "/src/assets/images/device_lora_terminal_1794841685891.jpg",
    imageFrameStyle: "module",
    summary:
      "用户面向高标准农田灌溉泵站部署的 LoRa 无线控制智能体，支持远程水泵接触器吸合、管道压力反馈与信道抗干扰优化。",
    protocols: ["LoRa 470MHz", "Modbus RTU", "定点传输"],
    defaultParams: "470MHz · 信道 12 · 空中速率 2.4kbps",
    specs: [
      { label: "通信距离", value: "实测空旷农田 3.2 公里稳定双向控制" },
      { label: "泵阀接口", value: "DO 继电器驱动交流接触器 + DI 运行反馈" },
      { label: "抗干扰", value: "独立网络 ID (PANID) + 通信超时安全停泵" },
      { label: "发布来源", value: "用户工作空间自定义发布" },
    ],
    quickCommands: [
      { command: "AT+NETID=1088", description: "配置泵站专用 LoRa 网络号避免同频串扰" },
    ],
    starterPrompts: [
      "水泵交流接触器吸合瞬间导致 LoRa 模块重启如何加装吸收电路？",
      "野外 3 公里处出现丢包，如何调整天线高度与空中速率？",
      "如何设置主机失联 60 秒后从机自动停泵保护？",
    ],
    systemContext:
      "这是用户基于 LoRa 数传终端自定义发布的「农田泵站 LoRa 远传智能体」，用于远距离水泵启停控制、电磁抗干扰及超时安全保护。",
  },
];

