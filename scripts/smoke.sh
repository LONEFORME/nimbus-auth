#!/usr/bin/env bash
API=http://127.0.0.1:4000
JAR=/tmp/jar_a.txt
rm -f $JAR
EMAIL="smoke$(date +%s)@example.com"
PASS="Smoke1234"
PASS2="Smoke5678"
ok=0; fail=0

jget() { node -e "const d=JSON.parse(process.argv[1]);const p=process.argv[2].split('.').reduce((a,k)=>a&&a[k],d);console.log(p===undefined?'':p)" "$1" "$2"; }

check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS  $1 ($3)"; ok=$((ok+1)); else echo "FAIL  $1 (期望 $2, 实际 $3)"; fail=$((fail+1)); fi
}

req() { # method path token data  -> sets BODY CODE
  local m=$1 p=$2 t=$3 d=$4 extra=()
  [ -n "$t" ] && extra=(-H "Authorization: Bearer $t")
  [ -n "$d" ] && extra+=(-H 'Content-Type: application/json' -d "$d")
  local out
  out=$(curl -s -b $JAR -c $JAR -w "\n%{http_code}" -X "$m" "$API$p" "${extra[@]}")
  CODE=$(printf '%s' "$out" | tail -1)
  BODY=$(printf '%s' "$out" | sed '$d')
}

echo "== 1. 注册 =="
req POST /api/auth/register "" "{\"email\":\"$EMAIL\",\"name\":\"冒烟测试\",\"password\":\"$PASS\"}"
check "注册返回 201" 201 "$CODE"
TOKEN=$(jget "$BODY" "data.accessToken")
RTOKEN1=$(jget "$BODY" "data.user.email")
check "注册响应含邮箱" "$EMAIL" "$RTOKEN1"
[ -n "$TOKEN" ] && check "拿到 accessToken" yes yes

echo "== 2. 当前用户 =="
req GET /api/auth/me "$TOKEN" ""
check "GET /me 200" 200 "$CODE"
check "返回本人邮箱" "$EMAIL" "$(jget "$BODY" "data.user.email")"
check "密码哈希不外泄" "" "$(jget "$BODY" "data.user.passwordHash")"

echo "== 3. 未授权访问 =="
req GET /api/notes "" ""
check "无 token 访问 /notes 401" 401 "$CODE"
check "错误码 UNAUTHORIZED" "UNAUTHORIZED" "$(jget "$BODY" "error.code")"

echo "== 4. 受保护资源 CRUD =="
req POST /api/notes "$TOKEN" '{"title":"冒烟笔记","content":"hello"}'
check "创建笔记 201" 201 "$CODE"
NOTE_ID=$(jget "$BODY" "data.note.id")
req GET /api/notes "$TOKEN" ""
check "列出笔记 200" 200 "$CODE"
req PATCH "/api/notes/$NOTE_ID" "$TOKEN" '{"title":"改过的标题"}'
check "更新笔记 200" 200 "$CODE"
check "标题已更新" "改过的标题" "$(jget "$BODY" "data.note.title")"

echo "== 5. 刷新令牌轮换 =="
RTOKEN_COOKIE=$(grep nimbus_rt $JAR | awk '{print $7}')
req POST /api/auth/refresh "" ""
check "刷新 200" 200 "$CODE"
TOKEN2=$(jget "$BODY" "data.accessToken")
[ -n "$TOKEN2" ] && [ "$TOKEN2" != "$TOKEN" ] && check "换发了新 accessToken" yes yes || check "换发了新 accessToken" yes no
req GET /api/auth/me "$TOKEN2" ""
check "新 token 可用" 200 "$CODE"
echo "-- 重放旧刷新令牌（应触发全量吊销）"
out=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/refresh" -H "Cookie: nimbus_rt=$RTOKEN_COOKIE")
check "重放旧令牌 401" 401 "$(printf '%s' "$out" | tail -1)"

echo "== 6. 登出 =="
req POST /api/auth/login "" "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
check "重新登录 200" 200 "$CODE"
TOKEN3=$(jget "$BODY" "data.accessToken")
req POST /api/auth/logout "" ""
check "登出 204" 204 "$CODE"
req POST /api/auth/refresh "" ""
check "登出后刷新 401" 401 "$CODE"

echo "== 7. 改密 =="
req POST /api/auth/login "" "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
TOKEN4=$(jget "$BODY" "data.accessToken")
req PATCH /api/auth/password "$TOKEN4" "{\"currentPassword\":\"$PASS\",\"newPassword\":\"$PASS2\"}"
check "改密 200" 200 "$CODE"
req POST /api/auth/login "" "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
check "旧密码登录 401" 401 "$CODE"
req POST /api/auth/login "" "{\"email\":\"$EMAIL\",\"password\":\"$PASS2\"}"
check "新密码登录 200" 200 "$CODE"

echo "== 8. 参数校验 =="
req POST /api/auth/register "" '{"email":"bad-email","name":"x","password":"123"}'
check "非法注册 422" 422 "$CODE"
check "校验错误码" "VALIDATION_ERROR" "$(jget "$BODY" "error.code")"
check "字段级错误存在" yes "$([ -n "$(jget "$BODY" "error.details.0.path")" ] && echo yes || echo no)"
check "带 requestId" yes "$([ -n "$(jget "$BODY" "error.requestId")" ] && echo yes || echo no)"

echo "== 9. RBAC =="
rm -f $JAR
req POST /api/auth/login "" '{"email":"admin@example.com","password":"Admin123!"}'
ADMIN_TOKEN=$(jget "$BODY" "data.accessToken")
check "管理员登录 200" 200 "$CODE"
req GET "/api/users?page=1&pageSize=5" "$ADMIN_TOKEN" ""
check "管理员查用户列表 200" 200 "$CODE"
check "分页字段齐全" "5" "$(jget "$BODY" "data.pageSize")"
rm -f $JAR
req POST /api/auth/login "" '{"email":"demo@example.com","password":"Demo1234"}'
DEMO_TOKEN=$(jget "$BODY" "data.accessToken")
req GET /api/users "$DEMO_TOKEN" ""
check "普通用户查列表 403" 403 "$CODE"
check "错误码 FORBIDDEN" "FORBIDDEN" "$(jget "$BODY" "error.code")"

echo "== 10. 越权删除他人笔记 =="
req POST /api/notes "$DEMO_TOKEN" '{"title":"demo 的笔记"}'
DEMO_NOTE=$(jget "$BODY" "data.note.id")
req DELETE "/api/notes/$DEMO_NOTE" "$TOKEN4" ""
check "跨用户删除 404" 404 "$CODE"

echo "== 11. 未知接口 =="
req GET /api/nope "" ""
check "404" 404 "$CODE"

echo
echo "结果: 通过 $ok 项, 失败 $fail 项"
[ $fail -eq 0 ]
