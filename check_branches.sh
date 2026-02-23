#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}بدء عملية التأكد من الفروع...${NC}"

# تأكد إننا في مستودع git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}الخطأ: مش داخل مستودع git. تأكد من إنك في مجلد المشروع.${NC}"
    exit 1
fi

# جلب آخر التحديثات من GitHub
echo -e "${YELLOW}1. جلب آخر التحديثات من remote...${NC}"
git fetch --all

# قائمة الفروع المطلوبة (كمصفوفة)
branches=("feature-backend-folder" "feature-mobile-folder" "feature-web-folder")

# لكل فرع
for branch in "${branches[@]}"; do
    echo -e "\n${BLUE}==========================================${NC}"
    echo -e "${GREEN}الفرع: $branch${NC}"
    echo -e "${BLUE}==========================================${NC}"

    # التبديل إلى الفرع (مع سحب آخر تحديث)
    if git checkout "$branch"; then
        git pull origin "$branch"
    else
        echo -e "${RED}فشل في التبديل للفرع $branch - تخطي إلى التالي${NC}"
        continue
    fi

    # عرض هيكل الملفات (باستثناء .git)
    echo -e "${YELLOW}--- هيكل الملفات في الفرع $branch ---${NC}"
    ls -la --ignore=.git

    # البحث عن package.json وتجربة تشغيل npm
    if [ -f "package.json" ]; then
        echo -e "${YELLOW}الفرع $branch يحتوي على package.json. جاري تشغيل npm install و npm test...${NC}"
        npm install && npm test
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✔ npm test نجح في الفرع $branch${NC}"
        else
            echo -e "${RED}✘ npm test فشل في الفرع $branch${NC}"
        fi
    else
        echo -e "${YELLOW}لا يوجد package.json في هذا الفرع. تخطي الاختبار.${NC}"
    fi

    echo -e "${BLUE}انتهى فحص الفرع $branch${NC}"
done

# الرجوع إلى main في النهاية
echo -e "\n${YELLOW}الرجوع إلى الفرع main...${NC}"
git checkout main

echo -e "\n${GREEN}✔ تم الانتهاء من جميع الفروع.${NC}"