<template>
    <!-- 选择关键字 -->
    <el-dialog title="选择关键字" v-model="visible" width="800px" top="5vh" append-to-body>
        <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="100px">
            <el-form-item label="机器人名称" prop="nickname">
                <el-input v-model="queryParams.nickname" placeholder="请输入机器人名称" clearable style="width: 240px"
                    @keyup.enter="handleQuery" />
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
        <el-row>
            <el-table :row-key="getRowKeys" @row-click="clickRow" ref="refTable" :data="robotList"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" :reserve-selection="true" width="55" align="center" />
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
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-row>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleSelectRobot">确 定</el-button>
                <el-button @click="handleCancel">取 消</el-button>
            </div>
        </template>
    </el-dialog>
</template>
 
<script setup name="DeptBindRobot">
import { listRobot } from "@/api/control/robot";
import { bindRobot, getRobotsByDeptId } from "@/api/system/dept";

const { proxy } = getCurrentInstance();
const { robot_status } = proxy.useDict("robot_status");


const robotList = ref([]);
const robotIds = ref([]);
const boundRobotIds = ref([]);
const visible = ref(false);
const total = ref(0);
const deptId = ref(0);

function getRowKeys(row) {
    return row.robotId;//注意：如果记录唯一值为id，则用row.id.总之要返回记录的唯一标识
}

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    nickname: undefined,
    remark: undefined
});

// 显示弹框
function show(id) {
    robotList.value = [];
    robotIds.value = [];
    deptId.value = id;
    getList();
    getBindList();
    visible.value = true;
}

const reserveSelection = () => {
    proxy.$refs["refTable"].clearSelection();

    boundRobotIds.value.forEach((item) => {
        proxy.$refs["refTable"].toggleRowSelection({ robotId: item }, true); //让页面显示选中的数据

    })

}


/**选择行 */
function clickRow(row) {
    // console.log(row)
    proxy.$refs["refTable"].toggleRowSelection(row);
}
// 多选框选中数据
function handleSelectionChange(selection) {
    robotIds.value = selection.map(item => item.robotId);
}
// 查询表数据
function getList() {
    listRobot(queryParams).then(res => {
        robotList.value = res.rows;
        total.value = res.total;
        // reserveSelection();
    });

}

// 查询场景绑定机器人数据
function getBindList() {
    getRobotsByDeptId(deptId.value).then(res => {
        boundRobotIds.value = res.data;
        reserveSelection();
    });

}

/** 搜索按钮操作 */
function handleQuery() {
    queryParams.pageNum = 1;
    getList();
}
/** 重置按钮操作 */
function resetQuery() {
    proxy.resetForm("queryRef");
    handleQuery();
}

const emit = defineEmits(["ok"]);

/** 选择绑定机器人操作 */
function handleSelectRobot() {
    // console.log(robotIds.value)
    bindRobot({ deptId: deptId.value, robotIds: robotIds.value }).then(res => {
        proxy.$modal.msgSuccess(res.msg);
        if (res.code === 200) {
            visible.value = false;
            proxy.$refs["refTable"].clearSelection();

        }
    });

}

function handleCancel() {
    proxy.$refs["refTable"].clearSelection();
    visible.value = false;
}

defineExpose({
    show,
});
</script>
 