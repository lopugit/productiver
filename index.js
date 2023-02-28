const axios = require('axios')
require('dotenv').config()
const fs = require('fs')

async function getToday() {
  // before date DD-MM-YYYY format of Date.now()
  const beforeDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  console.log(beforeDate)
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
  console.log('Got', data.length, 'results')
  fs.writeFileSync('output.json', JSON.stringify(data, null, 2))
}

getToday()