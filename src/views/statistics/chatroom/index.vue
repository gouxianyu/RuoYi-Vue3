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
                    <el-tree :data="deptOptions" :props="{ label: 'label', children: 'children' }"
                        :expand-on-click-node="false" :filter-node-method="filterNode" ref="deptTreeRef" node-key="id"
                        highlight-current default-expand-all @node-click="handleNodeClick" />
                </div>
            </el-col>

            <!--群聊数据-->
            <el-col :span="20" :xs="24">
                <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
                    <el-form-item label="群名称" prop="roomName">
                        <el-input v-model="queryParams.roomName" placeholder="请输入群名称" clearable style="width: 160px"
                            @keyup.enter="handleQuery" />
                    </el-form-item>
                    <el-form-item label="备注" prop="remark">
                        <el-input v-model="queryParams.remark" placeholder="请输入群备注" clearable style="width: 160px"
                            @keyup.enter="handleQuery" />
                    </el-form-item>

                    <el-form-item label="机器人" prop="robotId">
                        <el-select v-model="queryParams.robotId" placeholder="机器人" clearable style="width: 160px">
                            <el-option v-for="robot in robotOptions" :key="robot.robotId" :label="robot.nickname"
                                :value="robot.robotId" />
                        </el-select>
                    </el-form-item>


                    <el-form-item>
                        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                    </el-form-item>
                </el-form>

                <el-row :gutter="10" class="mb8">
                    <el-col :span="1.5">
                        <el-button type="warning" plain icon="Download" @click="handleExport"
                            v-hasPermi="['system:user:export']">导出</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>

                <el-table v-loading="loading" :data="chatroomList" @selection-change="handleSelectionChange">
                    <!-- <el-table-column type="selection" width="50" align="center" /> -->
                    <el-table-column label="群号" align="center" key="roomId" prop="roomId" />
                    <el-table-column label="群名称" align="center" key="roomName" prop="roomName"
                        :show-overflow-tooltip="true" />
                    <el-table-column label="部门" align="center" key="deptName" prop="dept.deptName"
                        :show-overflow-tooltip="true" />
                    <el-table-column label="机器人" align="center" key="robotName" prop="robot.nickname"
                        :show-overflow-tooltip="true" />
                    <el-table-column label="备注" align="center" key="remark" prop="remark" :show-overflow-tooltip="true" />
                    <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
                        <template #default="scope">
                            <el-tooltip content="修改" placement="top" v-if="scope.row.userId !== 1">
                                <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                    v-hasPermi="['statistics:chatroom:edit']"></el-button>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                </el-table>
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                    v-model:limit="queryParams.pageSize" @pagination="getList" />
            </el-col>
        </el-row>


        <!-- 添加或修改用户配置对话框 -->
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

    </div>
</template>
 
<script setup name="Chatroom">
import { getToken } from "@/utils/auth";
import { listChatroom, getChatroom, updateChatroom } from "@/api/statistics/chatroom";
import { deptTreeSelect } from "@/api/system/user";
import { getSelectRobot } from "@/api/control/robot";

const router = useRouter();
const { proxy } = getCurrentInstance();
const { sys_normal_disable, sys_user_sex, robot_status } = proxy.useDict("sys_normal_disable", "sys_user_sex", 'robot_status');

const chatroomList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);
const deptName = ref("");
const deptOptions = ref(undefined);
const robotOptions = ref(undefined);

/*** 用户导入参数 */
const upload = reactive({
    // 是否显示弹出层（用户导入）
    open: false,
    // 弹出层标题（用户导入）
    title: "",
    // 是否禁用上传
    isUploading: false,
    // 是否更新已经存在的用户数据
    updateSupport: 0,
    // 设置上传的请求头部
    headers: { Authorization: "Bearer " + getToken() },
    // 上传的地址
    url: import.meta.env.VITE_APP_BASE_API + "/system/user/importData"
});

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        roomName: undefined,
        robotId: undefined,
        deptId: undefined
    },
    rules: {}
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

/** 查询部门机器人下拉框结构 */
function getRobotSelectList() {
    queryParams.value.robotId = undefined;
    getSelectRobot({ deptId: queryParams.value.deptId }).then(response => {
        robotOptions.value = response.data;
    });
};

/** 查询群聊列表 */
function getList() {
    loading.value = true;
    listChatroom(queryParams.value).then(res => {
        loading.value = false;
        chatroomList.value = res.rows;
        total.value = res.total;
    });
};
/** 节点单击事件 */
function handleNodeClick(data) {
    queryParams.value.deptId = data.id;
    handleQuery();
    getRobotSelectList();
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
    queryParams.value.robotId = undefined;
    proxy.$refs.deptTreeRef.setCurrentKey(null);
    handleQuery();
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
        roomId: undefined,
        robotId: undefined,
        remark: undefined
    };
    proxy.resetForm("chatroomRef");
};
/** 取消按钮 */
function cancel() {
    open.value = false;
    reset();
};

/** 修改按钮操作 */
function handleUpdate(row) {
    reset();
    const roomId = row.roomId || ids.value;
    const robotId = row.robotId || ids.value;
    getChatroom({ roomId: roomId, robotId: robotId }).then(response => {
        form.value = response.data;
        open.value = true;
        title.value = "修改群";
    });
};
/** 提交按钮 */
function submitForm() {
    proxy.$refs["chatroomRef"].validate(valid => {
        if (valid) {

            updateChatroom(form.value).then(response => {
                proxy.$modal.msgSuccess("修改成功");
                open.value = false;
                getList();
            });

        }
    });
};




getDeptTree();
getRobotSelectList();
getList();
</script>
 