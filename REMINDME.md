# 科学的记忆方法背单词

不用费力死记硬背，跟着APP的规划走流程就记住单词了。

## 业务流程图：用户怎么用

1、建立学习计划：选择单词本，根据选择的每天学习单词量，制定学习计划，自动计算出每天学习和复习的内容。
2、学习日程页面：有今天的学习和复习的任务，点击开始学习，进入学习卡片。
3、学习卡片页面：在首次学习时，点击右上角的筛选按钮，可以选择已经认识的单词，今后就不会出现在学习中。`学习过程中认识的单词不要筛选，因为这些刚认识的单词需要学习和复习进行加强记忆。`
4、学习卡片页面，点击下一步，进入下个单词的学习卡片。学到最后一个就学完了这次任务。
5、学习日程页面：上部有设置菜单，点击进入设置
6、设置页面：可以设置声音开关，关闭声音时，学习卡片不会自动朗读单词发音。
7、设置页面：可以重置或新建学习计划。点击重置学习计划，会进入选择单词本页面，可以制定新的学习计划。

## 数据流程图：数据从哪里来、到哪里去 `数据流图 = 数据的 “人生轨迹”，从出生 → 加工 → 存储 → 使用 → 消失。`

//-保存者全局设置的信息-比如：是否初始化-是否有学习计划-声音开关是否打开

### 初始化单词本：

```mermaid
graph LR;
    A[某单词_data.json]--读取and保存--> B[某单词***Store数据库];
    I[hasInit初始化是否成功]--以上单词本json导入都成功and保存-->J[configStore数据库];
  
```

### 生成学习计划：

```mermaid
graph LR;
    A[某单词***Store数据库]--打乱顺序and根据每天学习的单词个数分组--> B[wordGroup数据库];
    C[程序计算得出计划概要]--保存--> D[schemeBrief数据库];
    E[程序计算得出学习日期]--保存--> F[userScheme数据库];
    G[程序计算得出复习日期]--保存--> H[reviewScheme数据库];
   
```

### 每日学习任务：

```mermaid
graph LR;
    A[userScheme数据库]--读取当天学习计划-->B(展示开始学习链接);
    Q[reviewScheme数据库]--读取当天复习计划-->P(展示开始复习链接);
    C(点击开始学习链接)--保存当前分组cur_group--> D[configStore数据库];
    E(点击开始复习链接)--保存当前分组cur_group--> D[configStore数据库];
    C(点击开始学习链接)-->I{studyType是learn}--保存cur_study也就是userScheme的db_key和studyType--> D[configStore数据库];
    E(点击开始复习链接)-->H{studyType是review}--**保存cur_study也就是reviewScheme的db_key和studyType--> D[configStore数据库];
  
```

### 学习单词过程：

```mermaid
graph LR;
    A[wordGroup数据库]--读取某组单词then根据单词--> B[***Store数据库] --> C[展示到单词Card];
    D(小组单词学完)-->E{studyType是learn}--保存isFinish该组--> F[userScheme数据库];
    D(小组单词学完)-->H{studyType是review}--保存isFinish该组--> G[reviewScheme数据库];
  
```

### 筛选单词过程：

```mermaid
graph LR;
    A[(wordGroup数据库)]--读取某组单词--> B[选择早就认识的单词] --保存isKnown是true--> C[(wordGroup数据库)];
  
```

## 程序流程图：代码先跑哪、在跑哪

### 软件初始化

```mermaid
flowchart TD
    开始[开始] --> 步骤1[首页/对应Guide.tsx的checkInit函数]
    步骤1 --> 判断{是否满足条件hasInit为false或hasScheme为false}
    判断 -->|满足| 步骤2[去/book页面完成初始化数据库]
    判断 -->|不满足| 步骤3[去/daytask页面学习每日任务]
  
```

### 单词表页面的返回按钮展示

```mermaid
flowchart TD
    开始[开始] --> 步骤1[选择单词本]
    步骤1 --> 判断{是否满足条件hasScheme为false}
    判断 -->|满足| 步骤2[单词本页面无返回按钮]
    判断 -->|不满足| 步骤3[单词本页面有返回按钮]
  
```

### 学习计划生成

```mermaid
flowchart TD
    开始[开始] --> 步骤1[选择单词本]
    步骤1 --> 判断{是否满足条件单词本的数据库为空}
    判断 -->|满足| 步骤2[设置hasInit为false然后go/页面初始化数据库]
    判断 -->|不满足| 步骤3[制定学习计划then选择每日学习单词数量then点击开始学习]
    步骤3 --> 步骤4[进行单词分组/schemeBrief/生成学习计划]
    步骤4 --> 步骤5[跳转到/daytask页面]

  
```

### 每日学习任务

```mermaid
flowchart TD
    开始[开始] --> 步骤1[查看今天的学习和复习计划]
    步骤1 --> 步骤2[点击开始学习] --设置分组和学习计划的db_key--> 步骤3[go 学习卡片]
    步骤1 --> 步骤5[点击开始复习] --设置分组和学习计划的db_key--> 步骤3[go 学习卡片]
```

### 学习卡片

```mermaid
flowchart TD
    开始 --> 步骤1[下一步]
    步骤1 --> 步骤2[完成所有的单词] --根据cur_study的studyType--> 步骤3[设置userScheme数据库/reviewScheme数据库的isFinish为true]
```
