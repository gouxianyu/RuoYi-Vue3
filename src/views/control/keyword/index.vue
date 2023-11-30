<template>
    <div class="app-container">
       <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="关键字" prop="keyword">
             <el-input
                v-model="queryParams.keyword"
                placeholder="请输入关键字"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
             />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
             <el-input
                v-model="queryParams.remark"
                placeholder="请输入备注"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
             />
          </el-form-item>
          <el-form-item>
             <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
             <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
       </el-form>
 
       <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
             <el-button
                type="primary"
                plain
                icon="Plus"
                @click="handleAdd"
                v-hasPermi="['control:keyword:add']"
             >新增</el-button>
          </el-col>
          <el-col :span="1.5">
             <el-button
                type="success"
                plain
                icon="Edit"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['control:keyword:edit']"
             >修改</el-button>
          </el-col>
          <el-col :span="1.5">
             <el-button
                type="danger"
                plain
                icon="Delete"
                :disabled="multiple"
                @click="handleDelete"
                v-hasPermi="['control:keyword:remove']"
             >删除</el-button>
          </el-col>
          
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
       </el-row>
 
       <el-table v-loading="loading" :data="keywordList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <!-- <el-table-column label="关键字编号" align="center" prop="keywordId" /> -->
          <el-table-column label="主关键字" align="center" prop="keyword" :show-overflow-tooltip="true"/>
          <el-table-column label="临近剔除" align="center" prop="nearWord" :show-overflow-tooltip="true"/>
          <el-table-column label="包含剔除" align="center" prop="excludeWord" :show-overflow-tooltip="true"/>
          
          <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
             <template #default="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
             </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
             <template #default="scope">
                <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['control:keyword:edit']">修改</el-button>
                <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['control:keyword:remove']">删除</el-button>
             </template>
          </el-table-column>
       </el-table>
 
       <pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
       />
 
       <!-- 添加或修改参数配置对话框 -->
       <el-dialog :title="title" v-model="open" width="500px" append-to-body>
          <el-form ref="keywordRef" :model="form" :rules="rules" label-width="80px">
             <el-form-item label="关键字" prop="keyword">
                <el-input v-model="form.keyword" placeholder="请输入关键字" />
             </el-form-item>
             <el-form-item label="临近剔除" prop="nearWord">
                <el-input v-model="form.nearWord" placeholder="请输入关键字，以空格分隔" />
             </el-form-item>
             <el-form-item label="包含剔除" prop="excludeWord">
                <el-input v-model="form.excludeWord" placeholder="请输入关键字，以空格分隔" />
             </el-form-item>
             <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
             </el-form-item>
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
 
 <script setup name="Keyword">
 import useDictStore from '@/store/modules/dict'
 import { listKeyword, getKeyword, delKeyword, addKeyword, updateKeyword } from "@/api/control/keyword";
 
 const { proxy } = getCurrentInstance();
 const { sys_normal_disable } = proxy.useDict("sys_normal_disable");
 
 const keywordList = ref([]);
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
     keyword: undefined,
     remark: undefined
   },
   rules: {
    keyword: [{ required: true, message: "关键字不能为空", trigger: "blur" }]
   },
 });
 
 const { queryParams, form, rules } = toRefs(data);
 
 /** 查询关键字列表 */
 function getList() {
   loading.value = true;
   listKeyword(queryParams.value).then(response => {
     keywordList.value = response.rows;
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
     keywordId: undefined,
     keyword: undefined,
     nearWord: undefined,
     excludeWord: undefined,
     deptId: undefined,
     remark: undefined
   };
   proxy.resetForm("keywordRef");
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
   title.value = "添加关键字";
 }
 /** 多选框选中数据 */
 function handleSelectionChange(selection) {
   ids.value = selection.map(item => item.keywordId);
   single.value = selection.length != 1;
   multiple.value = !selection.length;
 }
 /** 修改按钮操作 */
 function handleUpdate(row) {
   reset();
   const keywordId = row.keywordId || ids.value;
   getKeyword(keywordId).then(response => {
     form.value = response.data;
     open.value = true;
     title.value = "修改关键字";
   });
 }
 /** 提交按钮 */
 function submitForm() {
   proxy.$refs["keywordRef"].validate(valid => {
     if (valid) {
       if (form.value.keywordId != undefined) {
         updateKeyword(form.value).then(response => {
           proxy.$modal.msgSuccess("修改成功");
           open.value = false;
           getList();
         });
       } else {
         addKeyword(form.value).then(response => {
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
   const keywordIds = row.keywordId || ids.value;
   proxy.$modal.confirm('是否确认删除关键字ID为"' + keywordIds + '"的数据项？').then(function() {
     return delKeyword(keywordIds);
   }).then(() => {
     getList();
     proxy.$modal.msgSuccess("删除成功");
   }).catch(() => {});
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
 
 getList();
 </script>
 