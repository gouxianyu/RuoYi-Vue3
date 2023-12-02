import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";
// 查询部门列表
export function listDept(query) {
  return request({
    url: '/system/dept/list',
    method: 'get',
    params: query
  })
}

// 查询部门列表（排除节点）
export function listDeptExcludeChild(deptId) {
  return request({
    url: '/system/dept/list/exclude/' + deptId,
    method: 'get'
  })
}

// 查询部门详细
export function getDept(deptId) {
  return request({
    url: '/system/dept/' + deptId,
    method: 'get'
  })
}

// 新增部门
export function addDept(data) {
  return request({
    url: '/system/dept',
    method: 'post',
    data: data
  })
}

// 修改部门
export function updateDept(data) {
  return request({
    url: '/system/dept',
    method: 'put',
    data: data
  })
}

// 删除部门
export function delDept(deptId) {
  return request({
    url: '/system/dept/' + deptId,
    method: 'delete'
  })
}


// 部门绑定机器人
export function bindRobot(data) {
  return request({
    url: '/system/dept/bindRobot',
    method: 'put',
    data: data
  })
}

// 查询部门绑定的机器人详细
export function getRobotsByDeptId(deptId) {
  return request({
    url: '/system/dept/getBindRobot/' + parseStrEmpty(deptId),
    method: 'get'
  })
}