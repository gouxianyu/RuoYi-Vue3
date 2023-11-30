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
    
         <el-form-item label="场景类型" prop="sceneType">
            <el-select
               v-model="queryParams.sceneType"
               placeholder="场景类型"
               clearable
               style="width: 240px"
            >
               <el-option
                  v-for="dict in skill_scene_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
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
               v-hasPermi="['control:skill:add']"
            >新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['control:skill:edit']"
            >修改</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['control:skill:remove']"
            >删除</el-button>
         </el-col>
         
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="skillList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="话术ID" align="center" prop="skillId" />
         <el-table-column label="场景编号" align="center" prop="sceneNumber" :show-overflow-tooltip="true"/>
         <el-table-column label="问题" align="center" prop="question" :show-overflow-tooltip="true"/>
         <el-table-column label="答复" align="center" prop="answer" :show-overflow-tooltip="true"/>
         
         <el-table-column label="场景类型" align="center" prop="sceneType">
            <template #default="scope">
               <dict-tag :options="skill_scene_type" :value="scope.row.sceneType" />
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
               <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['control:skill:edit']">修改</el-button>
               <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['control:skill:remove']">删除</el-button>
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
         <el-form ref="dictRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="场景编号" prop="sceneNumber">
               <el-input v-model="form.sceneNumber" placeholder="请输入场景编号" />
            </el-form-item>
            <el-form-item label="问题" prop="question">
               <el-input v-model="form.question" placeholder="请输入问题" />
            </el-form-item>
            <el-form-item label="答复" prop="answer">
               <el-input v-model="form.answer" placeholder="请输入答复" />
            </el-form-item>
            <el-form-item label="场景类型">
                     <el-select v-model="form.sceneType" placeholder="请选择">
                        <el-option
                           v-for="dict in skill_scene_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                        ></el-option>
                     </el-select>
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

<script setup name="Skill">
import useDictStore from '@/store/modules/dict'
import { listSkill, getSkill, delSkill, addSkill, updateSkill } from "@/api/control/skill";

const { proxy } = getCurrentInstance();
const { skill_scene_type } = proxy.useDict("skill_scene_type");

const skillList = ref([]);
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
    sceneNumber: undefined,
    remark: undefined,
    sceneType:undefined
  },
  rules: {
   question: [{ required: true, message: "问题不能为空", trigger: "blur" }],
   answer: [{ required: true, message: "答复不能为空", trigger: "blur" }]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询话术列表 */
function getList() {
  loading.value = true;
  listSkill(queryParams.value).then(response => {
    skillList.value = response.rows;
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
    skillId: undefined,
    sceneNumber: undefined,
    question: undefined,
    answer: undefined,
    sceneType: undefined,
    remark: undefined
  };
  proxy.resetForm("dictRef");
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
  title.value = "添加话术";
}
/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.skillId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const skillId = row.skillId || ids.value;
  getSkill(skillId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改话术";
  });
}
/** 提交按钮 */
function submitForm() {
  proxy.$refs["dictRef"].validate(valid => {
    if (valid) {
      if (form.value.skillId != undefined) {
        updateSkill(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addSkill(form.value).then(response => {
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
  const skillIds = row.skillId || ids.value;
  proxy.$modal.confirm('是否确认删除话术ID为"' + skillIds + '"的数据项？').then(function() {
    return delSkill(skillIds);
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
