<template>
   <div class="app-container">
      <el-row :gutter="20">
         <!--部门数据-->
         <el-col :span="4" :xs="24">
            <div class="head-container">
               <el-input v-model="deptName" placeholder="请输入部门名称" clearable prefix-icon="Search"
                  style="margin-bottom: 20px" />
            </div>
            <div class="head-container">
               <el-tree :data="deptOptions" :props="{ label: 'label', children: 'children' }" :expand-on-click-node="false"
                  :filter-node-method="filterNode" ref="deptTreeRef" node-key="id" highlight-current default-expand-all
                  @node-click="handleNodeClick" />
            </div>
         </el-col>
         <!--机器人数据-->
         <el-col :span="20" :xs="24">
            <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
               <el-form-item label="机器人名称" prop="nickname">
                  <el-input v-model="queryParams.nickname" placeholder="请输入机器人名称" clearable style="width: 240px"
                     @keyup.enter="handleQuery" />
               </el-form-item>
               <el-form-item label="备注" prop="remark">
                  <el-input v-model="queryParams.remark" placeholder="请输入机器人备注" clearable style="width: 240px"
                     @keyup.enter="handleQuery" />
               </el-form-item>


               <el-form-item>
                  <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
               </el-form-item>
            </el-form>

            <el-row :gutter="10" class="mb8">

               <el-col :span="1.5">
                  <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
                     v-hasPermi="['control:robot:edit']">修改</el-button>
               </el-col>
               <el-col :span="1.5">
                  <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
                     v-hasPermi="['control:robot:remove']">删除</el-button>
               </el-col>
               <el-col :span="1.5">
                  <el-button type="warning" plain icon="Download" @click="handleExport"
                     v-hasPermi="['control:robot:export']">导出</el-button>
               </el-col>
               <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
            </el-row>

            <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
               <el-table-column type="selection" width="50" align="center" />
               <!-- <el-table-column label="机器人编号" align="center" key="robotId" prop="robotId" /> -->
               <el-table-column label="机器人名称" align="center" key="nickname" prop="nickname"
                  :show-overflow-tooltip="true" />
               <el-table-column label="部门" align="center" key="deptName" prop="dept.deptName"
                  :show-overflow-tooltip="true" />
               <el-table-column label="已绑定场景" align="center" key="sceneName" prop="scene.sceneName"
                  :show-overflow-tooltip="true" />
               <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                     <dict-tag :options="robot_status" :value="scope.row.status" />
                  </template>
               </el-table-column>
               <el-table-column label="备注" align="center" key="remark" prop="remark" :show-overflow-tooltip="true" />

               <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
                  <template #default="scope">
                     <el-tooltip content="绑定群" placement="top" v-if="scope.row.sceneId !== 0">
                        <el-button link type="primary" icon="Service" @click="handleBindRoom(scope.row)"
                           v-hasPermi="['control:robot:bindRoom']"></el-button>
                     </el-tooltip>
                     <el-tooltip content="修改" placement="top">
                        <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                           v-hasPermi="['control:robot:edit']"></el-button>
                     </el-tooltip>
                     <el-tooltip content="删除" placement="top">
                        <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                           v-hasPermi="['control:robot:remove']"></el-button>
                     </el-tooltip>

                  </template>
               </el-table-column>
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
               v-model:limit="queryParams.pageSize" @pagination="getList" />
         </el-col>
      </el-row>

      <!-- 添加或修改机器人配置对话框 -->
      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
         <el-form :model="form" :rules="rules" ref="chatroomRef" label-width="80px">
            <el-row>
               <el-col :span="24">
                  <el-form-item label="备注">
                     <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">确 定</el-button>
               <el-button @click="cancel">取 消</el-button>
            </div>
         </template>
      </el-dialog>
      <bind-monitor ref="bindMonitorRef" />
   </div>
</template>

<script setup name="Robot">
import bindMonitor from "./bindMonitor";
import { getToken } from "@/utils/auth";
import { listRobot } from "@/api/control/robot";
import { deptTreeSelect } from "@/api/system/user";

const router = useRouter();
const { proxy } = getCurrentInstance();
const { sys_normal_disable, sys_user_sex, robot_status } = proxy.useDict("sys_normal_disable", "sys_user_sex", 'robot_status');

const userList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const deptName = ref("");
const deptOptions = ref(undefined);

const data = reactive({
   form: {},
   queryParams: {
      pageNum: 1,
      pageSize: 10,
      nickname: undefined,
      remark: undefined,
      status: undefined,
      deptId: undefined
   },
   rules: {
      userName: [{ required: true, message: "用户名称不能为空", trigger: "blur" }, { min: 2, max: 20, message: "用户名称长度必须介于 2 和 20 之间", trigger: "blur" }],
      nickname: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
      password: [{ required: true, message: "用户密码不能为空", trigger: "blur" }, { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }],
      email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
      phonenumber: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }]
   }
});

const { queryParams, form, rules } = toRefs(data);

/** 通过条件过滤节点  */
const filterNode = (value, data) => {
   if (!value) return true;
   return data.label.indexOf(value) !== -1;
};
/** 根据名称筛选部门树 */
watch(deptName, val => {
   proxy.$refs["deptTreeRef"].filter(val);
});
/** 查询部门下拉树结构 */
function getDeptTree() {
   deptTreeSelect().then(response => {
      deptOptions.value = response.data;
   });
};
/** 查询机器人列表 */
function getList() {
   loading.value = true;
   listRobot(queryParams.value).then(res => {
      loading.value = false;
      userList.value = res.rows;
      total.value = res.total;
   });
};
/** 节点单击事件 */
function handleNodeClick(data) {
   queryParams.value.deptId = data.id;
   handleQuery();
};
/** 搜索按钮操作 */
function handleQuery() {
   queryParams.value.pageNum = 1;
   getList();
};
/** 重置按钮操作 */
function resetQuery() {
   dateRange.value = [];
   proxy.resetForm("queryRef");
   queryParams.value.deptId = undefined;
   proxy.$refs.deptTreeRef.setCurrentKey(null);
   handleQuery();
};
/** 删除按钮操作 */
function handleDelete(row) {
   const userIds = row.userId || ids.value;
   proxy.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？').then(function () {
      return delUser(userIds);
   }).then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
   }).catch(() => { });
};
/** 导出按钮操作 */
function handleExport() {
   proxy.download("system/user/export", {
      ...queryParams.value,
   }, `user_${new Date().getTime()}.xlsx`);
};


/** 选择条数  */
function handleSelectionChange(selection) {
   ids.value = selection.map(item => item.userId);
   single.value = selection.length != 1;
   multiple.value = !selection.length;
};

/** 重置操作表单 */
function reset() {
   form.value = {
      userId: undefined,
      deptId: undefined,
      userName: undefined,
      nickName: undefined,
      password: undefined,
      phonenumber: undefined,
      email: undefined,
      sex: undefined,
      status: "0",
      remark: undefined,
      postIds: [],
      roleIds: []
   };
   proxy.resetForm("userRef");
};
/** 取消按钮 */
function cancel() {
   open.value = false;
   reset();
};

/** 修改按钮操作 */
function handleUpdate(row) {
   reset();
   const userId = row.userId || ids.value;
   getUser(userId).then(response => {
      form.value = response.data;
      postOptions.value = response.posts;
      roleOptions.value = response.roles;
      form.value.postIds = response.postIds;
      form.value.roleIds = response.roleIds;
      open.value = true;
      title.value = "修改用户";
      form.password = "";
   });
};
/** 提交按钮 */
function submitForm() {
   proxy.$refs["userRef"].validate(valid => {
      if (valid) {
         if (form.value.userId != undefined) {
            updateUser(form.value).then(response => {
               proxy.$modal.msgSuccess("修改成功");
               open.value = false;
               getList();
            });
         } else {
            addUser(form.value).then(response => {
               proxy.$modal.msgSuccess("新增成功");
               open.value = false;
               getList();
            });
         }
      }
   });
};

/** 打开绑定群弹窗 */
function handleBindRoom(row) {
   if (row.scene.sceneType === '1') {
      // 抓取类型
      proxy.$refs["bindMonitorRef"].show(row.robotId);
   }

}


getDeptTree();
getList();
</script>
