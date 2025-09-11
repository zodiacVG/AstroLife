#!/bin/bash

# 检查数据文件是否存在
if [ ! -f "/app/data/starships.json" ]; then
    echo "数据文件不存在，尝试从其他位置复制..."
    
    # 尝试从其他位置复制数据文件
    if [ -f "../data/starships.json" ]; then
        echo "从 ../data/starships.json 复制数据文件"
        mkdir -p /app/data
        cp ../data/starships.json /app/data/
    elif [ -f "data/starships.json" ]; then
        echo "从 data/starships.json 复制数据文件"
        mkdir -p /app/data
        cp data/starships.json /app/data/
    else
        echo "错误：无法找到数据文件"
        exit 1
    fi
fi

echo "数据文件准备完成"
ls -la /app/data/