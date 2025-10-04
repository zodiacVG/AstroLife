# 使用Python 3.11作为基础镜像，避免pydantic-core在Python 3.13上的编译问题
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制requirements.txt和runtime.txt
COPY requirements.txt .
COPY runtime.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制app目录内容到工作目录（保持目录结构）
COPY app/ ./app/

# 复制data目录到工作目录
COPY data/ ./data/

# 复制其他可能需要的文件
COPY prepare_data.sh .
COPY README.md .

# 暴露端口
EXPOSE $PORT

# 创建启动脚本
RUN echo '#!/bin/sh\nuvicorn app.main:app --host 0.0.0.0 --port $PORT' > start.sh && \
    chmod +x start.sh

# 启动命令
CMD ["./start.sh"]