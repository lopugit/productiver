const axios = require('axios')
require('dotenv').config()
const fs = require('fs')
const maps = require('./maps.js')

async function getToday() {
  // before date DD-MM-YYYY format of Date.now()
  const beforeDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const all = await axios.get('https://api.productive.io/api/v2/tasks', {
    params: {
      filter: {
        assignee_id: process.env.ASSIGNEE_ID,
        status: 1
      }
    },
    headers: {
      'X-Auth-Token': process.env.TOKEN,
      'X-Organization-Id': process.env.ORGANISATION_ID,
    }
  })
  const data = (all?.data?.data || []).filter((task) => {
    // filter task by date before current date
    return task.attributes.due_date <= beforeDate
  })
  console.log(`\n`)
  console.log('Got', data.length, 'results')
  fs.writeFileSync('output.json', JSON.stringify(data, null, 2))

  const proms = []

  for (const task of data) {
    const { relationships: { project: { data: { id: projectId } } } } = task
    proms.push(
      axios.get('https://api.productive.io/api/v2/projects/' + projectId, {
        headers: {
          'X-Auth-Token': process.env.TOKEN,
          'X-Organization-Id': process.env.ORGANISATION_ID,
        }
      }).then(project => {
        task.projectName = project.data.data.attributes.name
      })
    )
  }

  await Promise.all(proms)

  const sortedByProject = data.sort((a, b) => {
    return a.projectName.localeCompare(b.projectName)
  })

  // create Plans report for each task
  const PPP = sortedByProject.reduce((acc, task) => {
    const { attributes, projectName } = task
    const { title, task_number } = attributes
    return acc + `- ${maps[projectName] || projectName} ${task_number} ${title}
`
  }, `Plans
`)
  fs.writeFileSync('plans.txt', PPP)
  console.log(`\n`)
  console.log(PPP)
}

getToday()