import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询话术列表
export function listSkill(query) {
  return request({
    url: '/control/skill/list',
    method: 'get',
    params: query
  })
}

// 查询话术详细
export function getSkill(SkillId) {
  return request({
    url: '/control/skill/' + parseStrEmpty(SkillId),
    method: 'get'
  })
}

// 新增话术
export function addSkill(data) {
  return request({
    url: '/control/skill',
    method: 'post',
    data: data
  })
}

// 修改话术
export function updateSkill(data) {
  return request({
    url: '/control/skill',
    method: 'put',
    data: data
  })
}

// 删除话术
export function delSkill(SkillId) {
  return request({
    url: '/control/skill/' + SkillId,
    method: 'delete'
  })
}
