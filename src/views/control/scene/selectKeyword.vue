<template>
   <!-- 选择关键字 -->
   <el-dialog title="选择关键字" v-model="visible" width="800px" top="5vh" append-to-body>
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
         <el-form-item label="关键字" prop="keyword">
            <el-input v-model="queryParams.keyword" placeholder="请输入关键字" clearable style="width: 240px"
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
         <el-table :row-key="getRowKeys" @row-click="clickRow" ref="refTable" :data="keywordList"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" :reserve-selection="true" width="55" align="center" />
            <el-table-column label="主关键字" align="center" prop="keyword" :show-overflow-tooltip="true" />
            <el-table-column label="临近剔除" align="center" prop="nearWord" :show-overflow-tooltip="true" />
            <el-table-column label="包含剔除" align="center" prop="excludeWord" :show-overflow-tooltip="true" />

            <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
            <el-table-column label="创建时间" align="center" prop="createTime" width="180">
               <template #default="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
               </template>
            </el-table-column>
         </el-table>
         <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-row>
      <template #footer>
         <div class="dialog-footer">
            <el-button type="primary" @click="handleSelectUser">确 定</el-button>
            <el-button @click="handleCancel">取 消</el-button>
         </div>
      </template>
   </el-dialog>
</template>

<script setup name="SelectKeyword">
import { listKeyword } from "@/api/control/keyword";

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");


const keywordList = ref([]);
const visible = ref(false);
const total = ref(0);
const keywordIds = ref([]);

function getRowKeys(row) {
   return row.keywordId;//注意：如果记录唯一值为id，则用row.id.总之要返回记录的唯一标识
}

const queryParams = reactive({
   pageNum: 1,
   pageSize: 10,
   keyword: undefined,
   remark: undefined
});

// 显示弹框
function show(kIds) {
   keywordIds.value = kIds;
   getList();
   visible.value = true;
}

const reserveSelection = () => {
   if (keywordIds.value.length !== 0) {
      keywordIds.value.forEach((item) => {
         proxy.$refs["refTable"].toggleRowSelection({ keywordId: item }, true); //让页面显示选中的数据
      });
   }
}


/**选择行 */
function clickRow(row) {
   // console.log(row)
   proxy.$refs["refTable"].toggleRowSelection(row);
}
// 多选框选中数据
function handleSelectionChange(selection) {
   keywordIds.value = selection.map(item => item.keywordId);
}
// 查询表数据
function getList() {
   listKeyword(queryParams).then(res => {
      keywordList.value = res.rows;
      total.value = res.total;
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
/** 选择授权关键字操作 */
function handleSelectUser() {
   const kIds = keywordIds.value;
   // if (kIds.length == 0) {
   //    proxy.$modal.msgError("请选择要添加的关键字");
   //    return;
   // }

   proxy.$refs["refTable"].clearSelection();
   visible.value = false;
   emit("ok", kIds);

}

function handleCancel() {
   proxy.$refs["refTable"].clearSelection();
   visible.value = false;
}

defineExpose({
   show,
});
</script>
