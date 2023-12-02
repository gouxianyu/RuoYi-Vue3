<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="场景名称" prop="sceneName">
                <el-input v-model="queryParams.keyword" placeholder="请输入场景名称" clearable style="width: 240px"
                    @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="场景类型" prop="sceneType">
                <el-select v-model="queryParams.sceneType" placeholder="场景类型" clearable style="width: 240px">
                    <el-option v-for="dict in sys_scene_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
                <el-input v-model="queryParams.remark" placeholder="请输入备注" clearable style="width: 240px"
                    @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd"
                    v-hasPermi="['control:scene:add']">新增</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
                    v-hasPermi="['control:scene:edit']">修改</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
                    v-hasPermi="['control:scene:remove']">删除</el-button>
            </el-col>

            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="sceneList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="场景ID" align="center" prop="sceneId" />
            <el-table-column label="场景名称" align="center" prop="sceneName" :show-overflow-tooltip="true" />
            <el-table-column label="场景类型" align="center" prop="sceneType">
                <template #default="scope">
                    <dict-tag :options="sys_scene_type" :value="scope.row.sceneType" />
                </template>
            </el-table-column>
            <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
            <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button link type="primary" icon="Edit" @click="handelBindRobot(scope.row)"
                        v-hasPermi="['control:scene:bind']">绑定机器人</el-button>
                    <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                        v-hasPermi="['control:scene:edit']">修改</el-button>
                    <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                        v-hasPermi="['control:scene:remove']">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize" @pagination="getList" />

        <!-- 添加或修改参数配置对话框 -->
        <el-dialog :title="title" v-model="open" width="500px" append-to-body>
            <el-form ref="sceneRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="场景名称" prop="sceneName">
                    <el-input v-model="form.sceneName" placeholder="请输入场景名称" />
                </el-form-item>
                <el-form-item label="场景类型" prop="sceneType">
                    <el-select v-model="form.sceneType" placeholder="请选择">
                        <el-option v-for="dict in sys_scene_type" :key="dict.value" :label="dict.label"
                            :value="dict.value"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
                </el-form-item>

                <el-form-item label="选择关键字" prop="params" v-if="form.sceneType == 3">
                    <el-button type="primary" @click="openSelectKeyword">选 择</el-button>
                </el-form-item>


            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>
        <select-keyword ref="selectRef" @ok="handleSelectDone" />
        <bind-robot ref="bindRobotRef" />
    </div>
</template>
 
<script setup name="Scene">
import selectKeyword from "./selectKeyword";
import bindRobot from "./bindRobot";
import useDictStore from '@/store/modules/dict'
import { listScene, getScene, delScene, addScene, updateScene } from "@/api/control/scene";

const { proxy } = getCurrentInstance();
const { sys_scene_type } = proxy.useDict("sys_scene_type");

const sceneList = ref([]);
const keywordIds = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        sceneName: undefined,
        remark: undefined,
        sceneType: undefined
    },
    rules: {
        sceneName: [{ required: true, message: "场景名称不能为空", trigger: "blur" }],
        sceneType: [{ required: true, message: '场景类型不能为空', trigger:'change'}],
    },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询场景列表 */
function getList() {
    loading.value = true;
    listScene(queryParams.value).then(response => {
        sceneList.value = response.rows;
        total.value = response.total;
        loading.value = false;
    });
}
/** 取消按钮 */
function cancel() {
    open.value = false;
    reset();
}
/** 表单重置 */
function reset() {
    form.value = {
        sceneId: undefined,
        sceneName: undefined,
        sceneType: undefined,
        remark: undefined,
        keywordIds: []
    };
    keywordIds.value = [];
    proxy.resetForm("sceneRef");
}
/** 搜索按钮操作 */
function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}
/** 重置按钮操作 */
function resetQuery() {
    dateRange.value = [];
    proxy.resetForm("queryRef");
    handleQuery();
}
/** 新增按钮操作 */
function handleAdd() {
    reset();
    open.value = true;
    title.value = "添加场景";
}
/** 多选框选中数据 */
function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.sceneId);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}
/** 修改按钮操作 */
function handleUpdate(row) {
    reset();
    const sceneId = row.sceneId || ids.value;
    keywordIds.value = row.keywordIds;
    getScene(sceneId).then(response => {
        form.value = response.data;
        open.value = true;
        title.value = "修改场景";
    });
}


/** 提交按钮 */
function submitForm() {
    form.value.keywordIds = keywordIds.value;
    proxy.$refs["sceneRef"].validate(valid => {
        if (valid) {
            if (form.value.sceneId != undefined) {
                updateScene(form.value).then(response => {
                    proxy.$modal.msgSuccess("修改成功");
                    open.value = false;
                    getList();
                });
            } else {
                addScene(form.value).then(response => {
                    proxy.$modal.msgSuccess("新增成功");
                    open.value = false;
                    getList();
                });
            }
        }
    });
}
/** 删除按钮操作 */
function handleDelete(row) {
    const sceneIds = row.sceneId || ids.value;
    proxy.$modal.confirm('是否确认删除字典编号为"' + sceneIds + '"的数据项？').then(function () {
        return delScene(sceneIds);
    }).then(() => {
        getList();
        proxy.$modal.msgSuccess("删除成功");
    }).catch(() => { });
}
/** 导出按钮操作 */
function handleExport() {
    proxy.download("system/dict/type/export", {
        ...queryParams.value
    }, `dict_${new Date().getTime()}.xlsx`);
}
/** 刷新缓存按钮操作 */
function handleRefreshCache() {
    refreshCache().then(() => {
        proxy.$modal.msgSuccess("刷新成功");
        useDictStore().cleanDict();
    });
}

/** 打开选择关键字表弹窗 */
function openSelectKeyword() {
    proxy.$refs["selectRef"].show(keywordIds.value);
}

/** 打开绑定机器人弹窗 */
function handelBindRobot(row) {
    proxy.$refs["bindRobotRef"].show(row.sceneId);
}

function handleSelectDone(ids) {
    // console.log('接收到',ids)
    keywordIds.value = ids;

}

getList();
</script>
 