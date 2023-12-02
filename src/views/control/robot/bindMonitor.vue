<template>
    <!-- 选择关键字 -->
    <el-dialog title="工单群配置" v-model="visible" width="800px" top="5vh" append-to-body>
        <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="100px">
            <el-form-item label="群名称" prop="roomName">
                <el-input v-model="queryParams.roomName" placeholder="请输入群名称" clearable style="width: 240px"
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
            <el-table :row-key="getRowKeys" ref="refTable" :data="roomList"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" :reserve-selection="true" width="55" align="center" />
                <el-table-column label="群号" align="center" key="roomId" prop="roomId" />
                <el-table-column label="群名称" align="center" key="roomName" prop="roomName" :show-overflow-tooltip="true" />
                <el-table-column label="备注" align="center" key="remark" prop="remark" :show-overflow-tooltip="true" />

                <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="配置白名单" placement="top" v-if="scope.row.userId !== 1">
                            <el-button link type="primary" icon="Edit" @click="handleWhiteList(scope.row)"
                                v-hasPermi="['control:robot:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="配置负责人" placement="top" v-if="scope.row.userId !== 1">
                            <el-button link type="primary" icon="User" @click="handleLeader(scope.row)"
                                v-hasPermi="['control:robot:edit']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
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

<script setup name="BindMonitor">
import { listRobotMonitor,listRobotRooms } from "@/api/statistics/chatroom";

const { proxy } = getCurrentInstance();
const { robot_status } = proxy.useDict("robot_status");


const roomList = ref([]);//群列表
const monitorIds = ref([]);//监管群id
const visible = ref(false);
const total = ref(0);
const robotId = ref(0);

function getRowKeys(row) {
    return row.roomId;//注意：如果记录唯一值为id，则用row.id.总之要返回记录的唯一标识
}

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    robotId: undefined,
    roomName: undefined,
    remark: undefined
});

// 显示弹框
function show(id) {
    roomList.value = [];
    monitorIds.value = [];
    robotId.value = id;
    getList();
    visible.value = true;
}


/**选择行 */
function clickRow(row) {
    // console.log(row)
    proxy.$refs["refTable"].toggleRowSelection(row);
}
// 多选框选中数据
function handleSelectionChange(selection) {
    monitorIds.value = selection.map(item => item.roomId);
}
// 查询表数据
function getList() {
    queryParams.robotId = robotId.value;
    listRobotRooms(queryParams).then(res => {
        roomList.value = res.rows;
        total.value = res.total;
        // reserveSelection();
    });

}

/**配置监管群白名单 */
function handleWhiteList(row) {

}

/**配置监管群负责人 */
function handleLeader(row) {

}

/** 搜索按钮操作 */
function handleQuery() {
    queryParams.pageNum = 1;
    queryParams.robotId = robotId.value;
    getList();
}
/** 重置按钮操作 */
function resetQuery() {
    proxy.resetForm("queryRef");
    handleQuery();
}

const emit = defineEmits(["ok"]);


function handleCancel() {
    proxy.$refs["refTable"].clearSelection();
    visible.value = false;
}

defineExpose({
    show,
});
</script>