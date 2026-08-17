// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JobItem from '../src/components/JobItem.vue'
import type { JobInfo } from '../src/types'

describe('JobItem folders', () => {
  it('expands a folder and emits the nested job when it is clicked', async () => {
    const child: JobInfo = {
      name: 'deploy',
      fullName: 'team/deploy',
      url: 'http://jenkins.example/job/team/job/deploy/',
      color: 'blue'
    }
    const folder: JobInfo = {
      name: 'team',
      fullName: 'team',
      url: 'http://jenkins.example/job/team/',
      color: 'notbuilt',
      _class: 'com.cloudbees.hudson.plugins.folder.Folder',
      jobs: [child]
    }
    const wrapper = mount(JobItem, {
      props: { job: folder, favorited: false }
    })

    expect(wrapper.findAll('.job-item')).toHaveLength(1)
    await wrapper.find('.job-info').trigger('click')

    expect(wrapper.findAll('.job-item')).toHaveLength(2)
    expect(wrapper.emitted('click')).toBeUndefined()

    await wrapper.findAll('.job-info')[1].trigger('click')
    expect(wrapper.emitted('click')).toEqual([[child]])
  })
})
