export const sampleFamilyData = {
  id: '1',
  name: '张德厚',
  gender: 'male',
  birthYear: '1920',
  deathYear: '1998',
  avatar: '',
  generation: 1,
  bio: '张氏家族创始人，早年在故乡务农，后经商致富，乐善好施，为乡里所称颂。',
  spouse: {
    name: '李秀兰',
    gender: 'female',
    birthYear: '1922',
    deathYear: '2005',
    bio: '贤良淑德，相夫教子，为家族奠定根基。'
  },
  children: [
    {
      id: '2',
      name: '张明远',
      gender: 'male',
      birthYear: '1945',
      deathYear: '',
      avatar: '',
      generation: 2,
      bio: '长子，继承父业，将家族生意发展壮大，热心公益事业。',
      spouse: {
        name: '王芳',
        gender: 'female',
        birthYear: '1948',
        deathYear: '',
        bio: '人民教师，桃李满天下。'
      },
      children: [
        {
          id: '5',
          name: '张志强',
          gender: 'male',
          birthYear: '1970',
          deathYear: '',
          avatar: '',
          generation: 3,
          bio: '工程师，在国内知名科技企业任职，获多项专利。',
          spouse: {
            name: '陈晓燕',
            gender: 'female',
            birthYear: '1972',
            deathYear: '',
            bio: '医生，主任医师。'
          },
          children: [
            {
              id: '9',
              name: '张雨桐',
              gender: 'female',
              birthYear: '1998',
              deathYear: '',
              avatar: '',
              generation: 4,
              bio: '就读于北京大学，学业优秀。',
              spouse: null,
              children: []
            },
            {
              id: '10',
              name: '张雨泽',
              gender: 'male',
              birthYear: '2001',
              deathYear: '',
              avatar: '',
              generation: 4,
              bio: '热爱编程，高中时期即获信息学竞赛奖项。',
              spouse: null,
              children: []
            }
          ]
        },
        {
          id: '6',
          name: '张志慧',
          gender: 'female',
          birthYear: '1973',
          deathYear: '',
          avatar: '',
          generation: 3,
          bio: '律师，专注于知识产权领域，业界口碑极佳。',
          spouse: {
            name: '刘建国',
            gender: 'male',
            birthYear: '1971',
            deathYear: '',
            bio: '建筑设计师。'
          },
          children: [
            {
              id: '11',
              name: '刘思涵',
              gender: 'female',
              birthYear: '2000',
              deathYear: '',
              avatar: '',
              generation: 4,
              bio: '艺术院校就读，擅长国画与书法。',
              spouse: null,
              children: []
            }
          ]
        }
      ]
    },
    {
      id: '3',
      name: '张明辉',
      gender: 'male',
      birthYear: '1948',
      deathYear: '2020',
      avatar: '',
      generation: 2,
      bio: '次子，参军报国，转业后在政府部门工作，勤勉一生。',
      spouses: [
        {
          name: '孙玉兰',
          gender: 'female',
          birthYear: '1949',
          deathYear: '1978',
          bio: '元配，与张明辉军旅相识，婚后早逝。'
        },
        {
          name: '赵美华',
          gender: 'female',
          birthYear: '1950',
          deathYear: '',
          bio: '继配，护士长，救死扶伤数十载。'
        }
      ],
      children: [
        {
          id: '7',
          name: '张志军',
          gender: 'male',
          birthYear: '1975',
          deathYear: '',
          avatar: '',
          generation: 3,
          birthSpouseIndex: 0,
          bio: '继承父亲志向，投身军旅，现为团级军官。元配孙玉兰所出，幼年丧母。',
          spouse: {
            name: '孙丽',
            gender: 'female',
            birthYear: '1978',
            deathYear: '',
            bio: '军医。'
          },
          children: [
            {
              id: '12',
              name: '张天宇',
              gender: 'male',
              birthYear: '2003',
              deathYear: '',
              avatar: '',
              generation: 4,
              bio: '军校在读，立志保家卫国。',
              spouse: null,
              children: []
            }
          ]
        }
      ]
    },
    {
      id: '4',
      name: '张明珍',
      gender: 'female',
      birthYear: '1952',
      deathYear: '',
      avatar: '',
      generation: 2,
      bio: '幼女，自幼聪慧好学，后成为大学教授，著述颇丰。',
      spouse: {
        name: '周正',
        gender: 'male',
        birthYear: '1950',
        deathYear: '2019',
        bio: '历史学教授，与妻子同为学界伉俪。'
      },
      children: [
        {
          id: '8',
          name: '周文博',
          gender: 'male',
          birthYear: '1980',
          deathYear: '',
          avatar: '',
          generation: 3,
          bio: '继承父母学脉，现为副教授，研究方向为人工智能与人文交叉。',
          spouse: {
            name: '杨静',
            gender: 'female',
            birthYear: '1982',
            deathYear: '',
            bio: '心理咨询师。'
          },
          children: [
            {
              id: '13',
              name: '周小雅',
              gender: 'female',
              birthYear: '2010',
              deathYear: '',
              avatar: '',
              generation: 4,
              bio: '聪颖活泼，喜爱阅读与绘画。',
              spouse: null,
              children: []
            }
          ]
        }
      ]
    }
  ]
}
