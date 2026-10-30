import json
def q(s):
    return "'" + str(s).replace("'", "''") + "'"
def arr(xs):
    return "array[" + ",".join(q(x) for x in xs) + "]::text[]" if xs else "'{}'::text[]"
out = ["-- SkillTwin Live seed data (generated). Run after schema.sql. Safe to re-run.\n",
       "truncate public.interview_questions, public.jobs, public.projects, public.resources, public.coding_challenges, public.questions, public.skills, public.domains cascade;\n"]

domains = [
 ('fullstack','Full Stack Developer','💻','Full Stack Developer','Build complete web apps: UI, APIs and databases.','₹6–14 LPA',1),
 ('data','Data Analyst','📊','Data Analyst','Turn raw data into decisions with SQL, Python and dashboards.','₹5–12 LPA',2),
 ('aiml','AI / ML Engineer','🤖','AI / ML Engineer','Train, evaluate and ship machine-learning models.','₹8–20 LPA',3),
]
out.append("insert into public.domains(id,name,icon,role_title,description,avg_salary,sort_order) values")
out.append(",\n".join(f"({q(a)},{q(b)},{q(c)},{q(d)},{q(e)},{q(f)},{g})" for a,b,c,d,e,f,g in domains)+";\n")

# domain, slug, name, weight, tier, description, keywords
skills = [
 ('fullstack','html-css','HTML & CSS',2,1,'Semantic markup, layout, responsive design.',['html','css','flexbox','grid','responsive','tailwind','bootstrap','sass']),
 ('fullstack','javascript','JavaScript',5,1,'Language core, async, ES6+.',['javascript','typescript','es6','async','promise','node']),
 ('fullstack','git','Git & Deployment',2,1,'Version control, GitHub, CI/CD basics.',['git','github','gitlab','ci/cd','deploy','vercel','netlify','docker']),
 ('fullstack','react','React',4,2,'Components, hooks, state, routing.',['react','redux','next.js','nextjs','jsx','hooks']),
 ('fullstack','nodejs','Node.js & APIs',4,2,'Servers, Express, REST design.',['node.js','nodejs','express','rest','api','graphql']),
 ('fullstack','databases','Databases & SQL',4,2,'Relational modelling, queries, auth data.',['sql','postgres','postgresql','mysql','mongodb','supabase','firebase','database']),
 ('data','sql','SQL',5,1,'Querying, joins, aggregation, window functions.',['sql','mysql','postgresql','postgres','bigquery','sqlite','query']),
 ('data','excel','Spreadsheets',2,1,'Excel/Sheets formulas, pivots, lookups.',['excel','spreadsheet','pivot','vlookup','xlookup','google sheets']),
 ('data','statistics','Statistics',4,1,'Distributions, hypothesis tests, inference.',['statistics','hypothesis','regression','probability','a/b test','p-value']),
 ('data','python-pandas','Python & Pandas',4,2,'Data wrangling and analysis in Python.',['python','pandas','numpy','jupyter']),
 ('data','data-cleaning','Data Cleaning',3,2,'Missing values, outliers, validation.',['data cleaning','etl','missing values','outlier','data quality','wrangling']),
 ('data','visualization','Visualization & BI',4,2,'Charts, dashboards, storytelling.',['tableau','power bi','powerbi','matplotlib','seaborn','dashboard','looker','visualization']),
 ('aiml','python','Python',4,1,'Python for scientific computing.',['python','numpy','pandas','jupyter']),
 ('aiml','math','Math for ML',4,1,'Linear algebra, calculus, probability.',['linear algebra','calculus','probability','statistics','gradient']),
 ('aiml','ml-basics','Machine Learning',5,2,'Supervised/unsupervised learning, evaluation.',['machine learning','scikit-learn','sklearn','regression','classification','random forest','xgboost']),
 ('aiml','deep-learning','Deep Learning',5,2,'Neural nets, CNNs, training loops.',['deep learning','pytorch','tensorflow','keras','cnn','neural network']),
 ('aiml','nlp','NLP & LLMs',4,3,'Text processing, transformers, LLM apps.',['nlp','transformers','bert','llm','hugging face','huggingface','langchain','rag']),
 ('aiml','mlops','MLOps & Deployment',3,3,'Serving, tracking, monitoring models.',['mlops','mlflow','docker','kubernetes','fastapi','airflow','model deployment']),
]
out.append("insert into public.skills(domain_id,slug,name,weight,tier,description,keywords) values")
out.append(",\n".join(f"({q(d)},{q(s)},{q(n)},{w},{t},{q(ds)},{arr(k)})" for d,s,n,w,t,ds,k in skills)+";\n")

# questions: domain, slug, prompt, options, correct, difficulty, explanation
Q = []
def add(d,s,p,o,c,df,e): Q.append((d,s,p,o,c,df,e))
# --- fullstack
add('fullstack','html-css','Which element is the most semantically appropriate for the main navigation links of a page?',['<div class="nav">','<nav>','<section>','<span>'],1,'easy','<nav> tells browsers and assistive tech that the block holds primary navigation.')
add('fullstack','html-css','In CSS Flexbox, which property aligns items along the main axis?',['align-items','justify-content','align-content','place-self'],1,'easy','justify-content distributes space along the main axis; align-items works on the cross axis.')
add('fullstack','html-css','What does `box-sizing: border-box` change?',['Width/height include padding and border','Margins collapse','Elements become inline','Borders become transparent'],0,'medium','With border-box the declared width includes padding and border, which makes layout maths predictable.')
add('fullstack','html-css','Which approach is mobile-first responsive design?',['Write desktop CSS, then override with max-width queries','Start with base styles for small screens and add min-width queries','Use fixed pixel widths','Use separate mobile site'],1,'medium','Mobile-first starts with the smallest layout and progressively enhances with min-width queries.')
add('fullstack','javascript','What does `typeof null` return in JavaScript?',['"null"','"undefined"','"object"','"number"'],2,'easy','A long-standing quirk: typeof null is "object".')
add('fullstack','javascript','What is a closure?',['A function bundled with references to its surrounding scope','A way to close a browser tab','A private class field only','A function without parameters'],0,'medium','Closures let a function keep access to variables from the scope where it was created.')
add('fullstack','javascript','What is logged? `console.log([1,2,3].map(n => n * 2).filter(n => n > 2))`',['[2,4,6]','[4,6]','[6]','[1,2,3]'],1,'medium','map gives [2,4,6]; filter keeps values greater than 2 → [4,6].')
add('fullstack','javascript','Which statement about `async/await` is true?',['await blocks the whole JS thread','An async function always returns a Promise','await can only be used with callbacks','async makes code run in a new thread'],1,'medium','Async functions always return a Promise; await pauses only that function, not the thread.')
add('fullstack','git','Which command creates and switches to a new branch?',['git branch -d feature','git checkout -b feature','git merge feature','git stash feature'],1,'easy','`git checkout -b` (or `git switch -c`) creates and switches in one step.')
add('fullstack','git','What does `git rebase main` do on a feature branch?',['Deletes main','Replays your commits on top of main','Pushes to origin','Squashes all history'],1,'medium','Rebase re-applies your commits on top of the target branch tip, producing linear history.')
add('fullstack','git','Which file keeps files out of version control?',['.gitkeep','.gitignore','.gitconfig','.env'],1,'easy','.gitignore lists patterns Git should not track.')
add('fullstack','git','In CI/CD, what is the main purpose of continuous integration?',['Manually test releases','Automatically build and test every change','Delete old branches','Encrypt secrets'],1,'medium','CI automatically builds and tests each commit to catch problems early.')
add('fullstack','react','What is the purpose of the `key` prop in a list?',['Style the element','Help React identify items between renders','Encrypt the data','Set tab order'],1,'easy','Stable keys let React match elements across renders and avoid wrong state reuse.')
add('fullstack','react','When does `useEffect(() => {...}, [])` run?',['After every render','Only after the first render','Before render','Never'],1,'medium','An empty dependency array runs the effect once after the initial mount.')
add('fullstack','react','Which is the correct way to update state based on previous state?',['setCount(count + 1)','setCount(c => c + 1)','count++','this.state.count = 1'],1,'medium','The functional form avoids stale values when updates are batched.')
add('fullstack','react','What problem does lifting state up solve?',['Slow network','Sharing state between sibling components','CSS specificity','Bundle size'],1,'medium','Moving state to the nearest common parent lets siblings share and sync it.')
add('fullstack','nodejs','Which HTTP method is idempotent and typically used to replace a resource?',['POST','PUT','PATCH always','CONNECT'],1,'medium','PUT replaces a resource and repeating it yields the same result.')
add('fullstack','nodejs','What status code should a REST API return for a successfully created resource?',['200','201','204','301'],1,'easy','201 Created signals a new resource was created.')
add('fullstack','nodejs','In Express, what is middleware?',['A database driver','A function with access to req, res and next','A template engine','A cluster manager'],1,'medium','Middleware functions run in sequence and can modify req/res or end the request.')
add('fullstack','nodejs','Why should you never trust client input?',['Browsers are slow','It can be malicious or malformed — validate on the server','JSON is insecure','CORS blocks it'],1,'easy','Anything coming from a client may be forged; validate and sanitise server-side.')
add('fullstack','databases','Which SQL clause filters rows AFTER grouping?',['WHERE','HAVING','ORDER BY','LIMIT'],1,'medium','HAVING filters aggregated groups; WHERE filters rows before grouping.')
add('fullstack','databases','What does a foreign key enforce?',['Unique values','Referential integrity between tables','Faster queries always','Encryption'],1,'easy','A foreign key ensures a value matches an existing row in the referenced table.')
add('fullstack','databases','Which JOIN returns all rows from the left table even without a match?',['INNER JOIN','LEFT JOIN','CROSS JOIN','SELF JOIN only'],1,'easy','LEFT JOIN keeps all left rows and fills NULLs where the right has no match.')
add('fullstack','databases','Why add an index to a column used in frequent WHERE filters?',['To save disk space','To speed up lookups','To enforce NOT NULL','To enable joins'],1,'medium','Indexes let the database find matching rows without scanning the whole table.')
# --- data
add('data','sql','Which function numbers rows within a partition?',['COUNT()','ROW_NUMBER()','SUM()','COALESCE()'],1,'medium','ROW_NUMBER() OVER (PARTITION BY ...) assigns sequential numbers within each partition.')
add('data','sql','What does `COALESCE(a, b)` return?',['The larger value','First non-NULL argument','a + b','Always b'],1,'easy','COALESCE returns the first argument that is not NULL.')
add('data','sql','Which query finds duplicate emails?',['SELECT email FROM u GROUP BY email HAVING COUNT(*) > 1','SELECT DISTINCT email FROM u','SELECT email FROM u WHERE COUNT(*) > 1','SELECT email FROM u ORDER BY email'],0,'medium','Group by email and keep groups with more than one row.')
add('data','sql','What is the difference between UNION and UNION ALL?',['UNION ALL keeps duplicates','UNION keeps duplicates','No difference','UNION ALL is slower always'],0,'medium','UNION removes duplicates (extra work); UNION ALL keeps every row.')
add('data','excel','Which lookup is most flexible and replaces VLOOKUP?',['HLOOKUP','XLOOKUP','COUNTIF','TEXTJOIN'],1,'easy','XLOOKUP looks in any direction and returns exact matches by default.')
add('data','excel','What do pivot tables do best?',['Format fonts','Summarise and group data interactively','Send email','Protect sheets'],1,'easy','Pivot tables aggregate, group and slice large data without formulas.')
add('data','excel','Which formula counts cells greater than 100 in A1:A50?',['=COUNT(A1:A50>100)','=COUNTIF(A1:A50,">100")','=SUMIF(A1:A50,100)','=IF(A1:A50>100)'],1,'medium','COUNTIF(range, criteria) counts cells that meet the criterion.')
add('data','excel','What does absolute reference `$A$1` do?',['Changes when copied','Stays fixed when copied','Deletes A1','Formats as currency'],1,'easy','Dollar signs lock the column and row so the reference does not shift.')
add('data','statistics','What does a p-value of 0.03 mean (α = 0.05)?',['Result is practically important','Evidence against the null at the 5% level','Null is 97% likely true','The effect is 3%'],1,'medium','p < α means the data would be unlikely under the null; it says nothing about effect size.')
add('data','statistics','Which measure is least affected by outliers?',['Mean','Median','Range','Variance'],1,'easy','The median depends on order, not extreme magnitudes.')
add('data','statistics','What does correlation NOT prove?',['Association','Causation','Linear trend','Direction'],1,'easy','Correlation does not imply causation — confounders may explain the link.')
add('data','statistics','In an A/B test, why decide sample size beforehand?',['To look nicer','To avoid peeking and underpowered results','To skip randomisation','To reduce cost only'],1,'hard','Pre-planned sample size controls power and avoids inflated false positives from peeking.')
add('data','python-pandas','Which pandas call gives counts per category in column `city`?',['df.city.sum()','df["city"].value_counts()','df.groupby()','df.count(city)'],1,'easy','value_counts() returns frequencies of each unique value.')
add('data','python-pandas','What does `df.dropna(subset=["age"])` do?',['Drops the age column','Drops rows where age is missing','Fills age with 0','Sorts by age'],1,'easy','subset limits the NA check to the listed columns and removes those rows.')
add('data','python-pandas','Which merges two DataFrames on a key?',['df1.append(df2)','pd.merge(df1, df2, on="id")','df1 + df2','pd.concat(axis=2)'],1,'medium','pd.merge performs database-style joins on key columns.')
add('data','python-pandas','What does `df.groupby("team")["score"].mean()` return?',['Overall mean','Mean score per team','Team names','Score counts'],1,'easy','Groups by team then averages the score column in each group.')
add('data','data-cleaning','A column has 3% missing values at random. A reasonable first step is…',['Delete the dataset','Understand why and impute or drop appropriately','Replace with 9999','Ignore the column forever'],1,'medium','Investigate the missingness mechanism, then choose imputation or removal deliberately.')
add('data','data-cleaning','Which technique flags outliers using quartiles?',['Z-score only','IQR rule (1.5 × IQR)','Min-max scaling','One-hot encoding'],1,'medium','Points beyond Q1−1.5·IQR or Q3+1.5·IQR are common outlier candidates.')
add('data','data-cleaning','Why standardise text values like "NY", "ny", "New York"?',['To enable accurate grouping and joins','To increase file size','To hide data','To speed up charts'],0,'easy','Inconsistent labels split one category into many and break joins.')
add('data','data-cleaning','What is a data validation rule example?',['Age must be between 0 and 120','Use dark mode','Add colours','Rename the file'],0,'easy','Validation rules assert allowed ranges/formats so bad rows are caught early.')
add('data','visualization','Best chart for showing a trend over time?',['Pie chart','Line chart','Scatter of IDs','Stacked area of unrelated series'],1,'easy','Line charts emphasise change across ordered time points.')
add('data','visualization','Which is the most important dashboard design principle?',['Use as many colours as possible','Show the key metric clearly with context','Hide axes always','Use 3D charts'],1,'medium','Dashboards should make the primary insight obvious and comparable.')
add('data','visualization','When is a pie chart acceptable?',['Many categories','Few parts of a whole that add to 100%','Time series','Negative values'],1,'medium','Pies work only for a handful of categories that sum to a whole.')
add('data','visualization','What does a box plot show?',['Exact values only','Median, quartiles and outliers','Correlation matrix','Time trend'],1,'medium','A box plot summarises distribution with median, IQR and outliers.')
# --- aiml
add('aiml','python','Which structure is best for fast membership tests?',['list','set','tuple','str'],1,'easy','Sets use hashing so `x in s` is O(1) on average.')
add('aiml','python','What does `[x**2 for x in range(4)]` produce?',['[0,1,4,9]','[1,4,9,16]','[0,2,4,6]','[1,2,3,4]'],0,'easy','range(4) yields 0..3 so the squares are [0,1,4,9].')
add('aiml','python','What is a NumPy broadcasting advantage?',['Operates on arrays of different shapes without copying loops','Makes Python compiled','Encrypts arrays','Sorts automatically'],0,'medium','Broadcasting applies operations across compatible shapes efficiently.')
add('aiml','python','Which keyword defines a generator function?',['return','yield','async','lambda'],1,'medium','yield produces values lazily and pauses function state.')
add('aiml','math','What does the gradient of a function point toward?',['Steepest decrease','Steepest increase','Minimum','Zero'],1,'medium','The gradient points in the direction of fastest increase; descent uses its negative.')
add('aiml','math','The dot product of two orthogonal vectors is…',['1','0','-1','Undefined'],1,'easy','Orthogonal vectors have zero dot product.')
add('aiml','math','Bayes’ theorem relates…',['P(A|B) to P(B|A), P(A), P(B)','Mean to variance','Loss to accuracy','Rows to columns'],0,'medium','P(A|B) = P(B|A)·P(A) / P(B).')
add('aiml','math','What does variance measure?',['Central value','Spread around the mean','Skew direction','Sample count'],1,'easy','Variance is the average squared deviation from the mean.')
add('aiml','ml-basics','What is overfitting?',['Model performs well on training but poorly on new data','Model is too small','Training takes long','Data is clean'],0,'easy','An overfit model memorises noise and fails to generalise.')
add('aiml','ml-basics','Which metric suits heavily imbalanced classification better than accuracy?',['Precision/Recall or F1','Mean squared error','R²','Silhouette'],0,'medium','Accuracy hides minority-class failure; precision, recall and F1 expose it.')
add('aiml','ml-basics','Why split data into train/validation/test sets?',['To estimate generalisation honestly','To reduce rows','To speed GPUs','To remove features'],0,'easy','Held-out data gives unbiased estimates and guards against tuning to the test set.')
add('aiml','ml-basics','Regularisation (L2) mainly…',['Penalises large weights to reduce overfitting','Increases learning rate','Adds features','Removes labels'],0,'medium','L2 shrinks weights, lowering model variance.')
add('aiml','deep-learning','What does backpropagation compute?',['Gradients of the loss w.r.t. weights','Random weights','Accuracy','Data splits'],0,'medium','Backprop applies the chain rule to get gradients for every parameter.')
add('aiml','deep-learning','Which activation helps mitigate vanishing gradients in deep nets?',['Sigmoid','ReLU','Step','Linear only'],1,'medium','ReLU keeps gradients from saturating for positive inputs.')
add('aiml','deep-learning','CNNs are particularly effective for…',['Tabular joins','Spatial data like images','Sorting','Key-value storage'],1,'easy','Convolutions exploit local spatial structure.')
add('aiml','deep-learning','What does dropout do during training?',['Randomly zeroes activations to regularise','Drops the dataset','Stops training','Increases batch size'],0,'medium','Dropout prevents co-adaptation of neurons by randomly disabling them.')
add('aiml','nlp','What is tokenisation?',['Splitting text into units the model processes','Encrypting text','Translating text','Removing stop words only'],0,'easy','Tokenisation converts raw text into tokens (words/subwords) the model ingests.')
add('aiml','nlp','What is the key idea behind self-attention?',['Each token weighs all other tokens when building its representation','Sequential processing only','Random sampling','Fixed n-grams'],0,'medium','Self-attention lets every position attend to every other position in the sequence.')
add('aiml','nlp','In RAG (retrieval-augmented generation), retrieval is used to…',['Fetch relevant context to ground the LLM answer','Train the model faster','Compress weights','Replace tokenisation'],0,'medium','RAG injects retrieved documents into the prompt to reduce hallucination.')
add('aiml','nlp','Why use embeddings for semantic search?',['Similar meanings map to nearby vectors','They are smaller than text always','They remove punctuation','They need no model'],0,'medium','Embeddings place semantically similar texts close together in vector space.')
add('aiml','mlops','What is model drift?',['Model performance degrades as data changes over time','GPU overheating','Slow training','Version mismatch'],0,'medium','Data or concept drift makes a deployed model less accurate over time.')
add('aiml','mlops','Why track experiments with a tool like MLflow?',['Reproducibility and comparison of runs','Faster GPUs','Free data','Automatic labels'],0,'easy','Tracking parameters, metrics and artefacts makes experiments reproducible.')
add('aiml','mlops','Which is a common way to serve a model as an API?',['FastAPI/Flask behind a container','Excel macro','Printing weights','Email attachments'],0,'easy','Wrap the model in a web service and containerise it for deployment.')
add('aiml','mlops','What does a model registry provide?',['Versioned, staged models for deployment','Raw data storage','Hyperparameter search','Labelling UI'],0,'medium','A registry tracks model versions and promotion stages.')

out.append("insert into public.questions(skill_id,prompt,options,correct_index,difficulty,explanation)\nselect s.id, v.p, v.o::jsonb, v.c, v.df, v.e from (values")
out.append(",\n".join(f"({q(d)},{q(s)},{q(p)},{q(json.dumps(o))},{c},{q(df)},{q(e)})" for d,s,p,o,c,df,e in Q))
out.append(") as v(d,s,p,o,c,df,e) join public.skills s on s.domain_id=v.d and s.slug=v.s;\n")

# coding challenges: domain, slug, title, prompt, fn, starter, tests, difficulty
C = [
 ('fullstack','javascript','Reverse a String','Write `reverseString(str)` that returns the string reversed.','reverseString','function reverseString(str) {\n  // your code\n}\n',[{"args":["hello"],"expected":"olleh"},{"args":[""],"expected":""},{"args":["a b"],"expected":"b a"}],'easy'),
 ('fullstack','javascript','Count Vowels','Write `countVowels(str)` that returns how many vowels (a,e,i,o,u — case-insensitive) the string has.','countVowels','function countVowels(str) {\n  // your code\n}\n',[{"args":["Hello"],"expected":2},{"args":["xyz"],"expected":0},{"args":["AEIOU"],"expected":5}],'easy'),
 ('data','statistics','Median of Numbers','Write `median(nums)` returning the median of an array of numbers (do not mutate the input).','median','function median(nums) {\n  // your code\n}\n',[{"args":[[3,1,2]],"expected":2},{"args":[[4,1,3,2]],"expected":2.5},{"args":[[7]],"expected":7}],'easy'),
 ('data','data-cleaning','Remove Duplicates','Write `unique(arr)` returning a new array with duplicates removed, keeping first occurrences in order.','unique','function unique(arr) {\n  // your code\n}\n',[{"args":[[1,2,2,3,1]],"expected":[1,2,3]},{"args":[[]],"expected":[]},{"args":[["a","a","b"]],"expected":["a","b"]}],'easy'),
 ('aiml','math','Dot Product','Write `dot(a, b)` returning the dot product of two equal-length numeric arrays.','dot','function dot(a, b) {\n  // your code\n}\n',[{"args":[[1,2,3],[4,5,6]],"expected":32},{"args":[[0,0],[5,9]],"expected":0},{"args":[[-1,2],[3,4]],"expected":5}],'easy'),
 ('aiml','ml-basics','Accuracy Score','Write `accuracy(yTrue, yPred)` returning the fraction of matching predictions (0–1).','accuracy','function accuracy(yTrue, yPred) {\n  // your code\n}\n',[{"args":[[1,0,1,1],[1,0,0,1]],"expected":0.75},{"args":[[1,1],[1,1]],"expected":1},{"args":[[0,0],[1,1]],"expected":0}],'medium'),
]
out.append("insert into public.coding_challenges(domain_id,skill_id,title,prompt,fn_name,starter_code,tests,difficulty)\nselect v.d, s.id, v.t, v.p, v.f, v.sc, v.ts::jsonb, v.df from (values")
out.append(",\n".join(f"({q(d)},{q(s)},{q(t)},{q(p)},{q(f)},{q(sc)},{q(json.dumps(ts))},{q(df)})" for d,s,t,p,f,sc,ts,df in C))
out.append(") as v(d,s,t,p,f,sc,ts,df) join public.skills s on s.domain_id=v.d and s.slug=v.s;\n")

# resources: domain, slug, title, url, kind, provider, minutes
R = [
 ('fullstack','html-css','Learn HTML','https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content','docs','MDN',90),
 ('fullstack','html-css','Learn CSS with web.dev','https://web.dev/learn/css','course','web.dev',120),
 ('fullstack','javascript','The Modern JavaScript Tutorial','https://javascript.info/','course','javascript.info',240),
 ('fullstack','javascript','JavaScript Guide','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide','docs','MDN',150),
 ('fullstack','git','Pro Git (free book)','https://git-scm.com/book/en/v2','docs','git-scm',180),
 ('fullstack','git','GitHub Hello World','https://docs.github.com/en/get-started/start-your-journey/hello-world','practice','GitHub Docs',30),
 ('fullstack','react','Learn React','https://react.dev/learn','docs','react.dev',180),
 ('fullstack','react','Built-in React Hooks','https://react.dev/reference/react/hooks','docs','react.dev',60),
 ('fullstack','nodejs','Introduction to Node.js','https://nodejs.org/en/learn/getting-started/introduction-to-nodejs','docs','nodejs.org',45),
 ('fullstack','nodejs','Express Routing Guide','https://expressjs.com/en/guide/routing.html','docs','expressjs.com',45),
 ('fullstack','databases','SQLBolt interactive lessons','https://sqlbolt.com/','practice','SQLBolt',120),
 ('fullstack','databases','PostgreSQL Tutorial','https://www.postgresql.org/docs/current/tutorial.html','docs','PostgreSQL',120),
 ('data','sql','SQLBolt interactive lessons','https://sqlbolt.com/','practice','SQLBolt',120),
 ('data','sql','Mode SQL Tutorial','https://mode.com/sql-tutorial/','course','Mode',180),
 ('data','excel','Excel help & learning','https://support.microsoft.com/en-us/excel','docs','Microsoft',90),
 ('data','excel','Google Sheets function list','https://support.google.com/docs/table/25273','docs','Google',45),
 ('data','statistics','Statistics & Probability','https://www.khanacademy.org/math/statistics-probability','course','Khan Academy',300),
 ('data','statistics','Seeing Theory','https://seeing-theory.brown.edu/','article','Brown University',60),
 ('data','python-pandas','10 minutes to pandas','https://pandas.pydata.org/docs/user_guide/10min.html','docs','pandas',30),
 ('data','python-pandas','Kaggle Pandas course','https://www.kaggle.com/learn/pandas','course','Kaggle',240),
 ('data','data-cleaning','Kaggle Data Cleaning','https://www.kaggle.com/learn/data-cleaning','course','Kaggle',240),
 ('data','data-cleaning','Working with missing data (pandas)','https://pandas.pydata.org/docs/user_guide/missing_data.html','docs','pandas',40),
 ('data','visualization','From Data to Viz','https://www.data-to-viz.com/','article','data-to-viz',45),
 ('data','visualization','Matplotlib tutorials','https://matplotlib.org/stable/tutorials/index.html','docs','Matplotlib',120),
 ('aiml','python','Python Tutorial','https://docs.python.org/3/tutorial/','docs','python.org',180),
 ('aiml','python','Kaggle Python course','https://www.kaggle.com/learn/python','course','Kaggle',300),
 ('aiml','math','Essence of Linear Algebra','https://www.3blue1brown.com/topics/linear-algebra','video','3Blue1Brown',150),
 ('aiml','math','Linear Algebra (Khan Academy)','https://www.khanacademy.org/math/linear-algebra','course','Khan Academy',300),
 ('aiml','ml-basics','Kaggle Intro to Machine Learning','https://www.kaggle.com/learn/intro-to-machine-learning','course','Kaggle',180),
 ('aiml','ml-basics','scikit-learn User Guide','https://scikit-learn.org/stable/user_guide.html','docs','scikit-learn',240),
 ('aiml','deep-learning','PyTorch Tutorials','https://pytorch.org/tutorials/','docs','PyTorch',240),
 ('aiml','deep-learning','Kaggle Intro to Deep Learning','https://www.kaggle.com/learn/intro-to-deep-learning','course','Kaggle',180),
 ('aiml','nlp','Hugging Face LLM Course','https://huggingface.co/learn/llm-course','course','Hugging Face',300),
 ('aiml','nlp','Speech and Language Processing','https://web.stanford.edu/~jurafsky/slp3/','docs','Stanford',600),
 ('aiml','mlops','MLflow Documentation','https://mlflow.org/docs/latest/','docs','MLflow',90),
 ('aiml','mlops','FastAPI Tutorial','https://fastapi.tiangolo.com/tutorial/','docs','FastAPI',120),
]
out.append("insert into public.resources(skill_id,title,url,kind,provider,minutes)\nselect s.id, v.t, v.u, v.k, v.pr, v.m from (values")
out.append(",\n".join(f"({q(d)},{q(s)},{q(t)},{q(u)},{q(k)},{q(pr)},{m})" for d,s,t,u,k,pr,m in R))
out.append(") as v(d,s,t,u,k,pr,m) join public.skills s on s.domain_id=v.d and s.slug=v.s;\n")

# projects: domain, title, summary, difficulty, hours, slugs, reqs
P = [
 ('fullstack','Task Manager with Auth','A multi-user task board with sign-in, per-user data and filters.','Beginner',12,['react','databases','html-css'],['Email/password authentication','Create, edit, delete tasks','Tasks are private to each user (row-level security)','Filter by status and due date','Responsive layout on mobile']),
 ('fullstack','REST API Backend','Design and ship a documented REST API with validation and tests.','Intermediate',16,['nodejs','databases','git'],['CRUD endpoints with proper status codes','Input validation and error handling','Pagination and filtering','Auth-protected routes','README with endpoint docs','Deployed to a public URL']),
 ('fullstack','Real-time Chat App','A chat app with rooms, presence and message history.','Advanced',24,['react','nodejs','javascript','databases'],['Realtime message delivery','Rooms/channels','Message history persisted','Typing / presence indicator','Rate limiting or spam protection']),
 ('data','Sales Dashboard','Clean a sales dataset and build an interactive dashboard with KPIs.','Beginner',10,['sql','visualization','excel'],['Load and inspect the dataset','Write SQL for monthly revenue and top products','Build KPI cards and trend chart','Add filters for region and category','Write 3 insights in plain English']),
 ('data','Customer Churn Analysis','Explore churn drivers using statistics and Python.','Intermediate',16,['python-pandas','statistics','data-cleaning'],['Clean missing and inconsistent values','Compute churn rate by segment','Run a hypothesis test on one driver','Visualise top 3 drivers','Recommend actions with evidence']),
 ('data','A/B Test Evaluation','Analyse an experiment and report whether to ship the variant.','Advanced',14,['statistics','sql','python-pandas'],['Validate randomisation','Compute conversion and confidence interval','Check statistical power','Segment results','Write a ship / no-ship memo']),
 ('aiml','House Price Predictor','Build a regression model with proper validation and error analysis.','Beginner',12,['python','ml-basics','math'],['Explore and clean the data','Train/validation/test split','Baseline vs improved model','Report MAE/RMSE and plot residuals','Explain top features']),
 ('aiml','Image Classifier (CNN)','Train a small CNN and analyse mistakes.','Intermediate',20,['deep-learning','python','math'],['Data loader and augmentation','CNN with a training loop','Track loss and accuracy curves','Confusion matrix and error review','Export model weights']),
 ('aiml','Document Q&A with RAG','Build a retrieval-augmented question answering app.','Advanced',26,['nlp','python','mlops'],['Chunk and embed documents','Vector search with relevance check','Prompt template that cites sources','Simple evaluation set','Serve via an API']),
]
out.append("insert into public.projects(domain_id,title,summary,difficulty,est_hours,skill_slugs,requirements) values")
out.append(",\n".join(f"({q(d)},{q(t)},{q(s)},{q(df)},{h},{arr(sl)},{q(json.dumps(rq))}::jsonb)" for d,t,s,df,h,sl,rq in P)+";\n")

# jobs: domain, title, company, location, type, level, salary, skills, desc
J = [
 ('fullstack','Junior Full Stack Developer','Northwind Labs (sample)','Bengaluru','Hybrid','Entry Level','₹6–9 LPA',['javascript','react','nodejs','databases'],'Build features across a React front end and Node API.'),
 ('fullstack','Frontend Engineer Intern','Pixelcraft Studio (sample)','Remote','Remote','Internship','₹25k/mo',['html-css','javascript','react'],'Implement responsive UI components from design specs.'),
 ('fullstack','Backend Developer','CloudNest Systems (sample)','Hyderabad','On-site','Mid Level','₹9–14 LPA',['nodejs','databases','git','javascript'],'Own REST services, database design and CI pipelines.'),
 ('fullstack','Web Developer','BrightLeaf Digital (sample)','Pune','Hybrid','Entry Level','₹4–6 LPA',['html-css','javascript','git'],'Deliver marketing sites and small web apps for clients.'),
 ('fullstack','Software Engineer I','Orbit Payments (sample)','Chennai','Hybrid','Entry Level','₹8–12 LPA',['javascript','react','nodejs','databases','git'],'Work on payment dashboards and internal APIs.'),
 ('data','Junior Data Analyst','Lumen Retail (sample)','Mumbai','Hybrid','Entry Level','₹4–7 LPA',['sql','excel','visualization'],'Report weekly KPIs and build dashboards for store managers.'),
 ('data','Business Analyst','FinSight Co (sample)','Bengaluru','On-site','Entry Level','₹6–9 LPA',['sql','excel','statistics','visualization'],'Translate business questions into analyses.'),
 ('data','Data Analyst (Python)','Quanta Health (sample)','Remote','Remote','Mid Level','₹8–12 LPA',['python-pandas','sql','statistics','data-cleaning'],'Clean clinical datasets and run exploratory analysis.'),
 ('data','BI Developer Intern','Metric Works (sample)','Hyderabad','Hybrid','Internship','₹20k/mo',['visualization','sql','excel'],'Build Power BI / Tableau reports.'),
 ('data','Product Analyst','Swiftly Apps (sample)','Gurugram','Hybrid','Mid Level','₹10–15 LPA',['sql','statistics','python-pandas','visualization'],'Run experiments and funnel analyses.'),
 ('aiml','Machine Learning Engineer','Neural Forge (sample)','Bengaluru','Hybrid','Mid Level','₹12–20 LPA',['python','ml-basics','deep-learning','mlops'],'Train and deploy production ML models.'),
 ('aiml','AI Engineer Intern','Sentient Labs (sample)','Remote','Remote','Internship','₹30k/mo',['python','ml-basics','nlp'],'Prototype LLM features and evaluate quality.'),
 ('aiml','Junior Data Scientist','Vector Analytics (sample)','Pune','On-site','Entry Level','₹7–11 LPA',['python','math','ml-basics'],'Build predictive models for customer analytics.'),
 ('aiml','NLP Engineer','Lexi AI (sample)','Hyderabad','Hybrid','Mid Level','₹14–22 LPA',['nlp','deep-learning','python'],'Develop retrieval and summarisation pipelines.'),
 ('aiml','MLOps Associate','Pipeline.io (sample)','Chennai','Hybrid','Entry Level','₹8–12 LPA',['mlops','python','ml-basics'],'Automate training, tracking and serving.'),
]
out.append("insert into public.jobs(domain_id,title,company,location,work_type,level,salary,required_skills,description,posted_at) values")
out.append(",\n".join(f"({q(d)},{q(t)},{q(c)},{q(l)},{q(w)},{q(lv)},{q(sa)},{arr(sk)},{q(ds)},now() - interval '{i%9} days')" for i,(d,t,c,l,w,lv,sa,sk,ds) in enumerate(J))+";\n")

# interview questions: domain|None, slug|None, track, prompt, key points
I = [
 ('fullstack','javascript','technical','Explain closures in JavaScript with a practical example.',['scope','function','variable','lexical','private','counter']),
 ('fullstack','javascript','technical','What is the event loop and how do promises fit into it?',['call stack','queue','microtask','async','callback','promise']),
 ('fullstack','react','technical','How do useState and useEffect work, and when would you use each?',['state','render','side effect','dependency','cleanup','re-render']),
 ('fullstack','nodejs','technical','How would you design a REST API for a to-do application?',['endpoint','get','post','status code','validation','authentication']),
 ('fullstack','databases','technical','When would you use an index, and what are the trade-offs?',['query','lookup','write','storage','where','scan']),
 ('data','sql','technical','Explain the difference between INNER JOIN and LEFT JOIN with an example.',['matching','null','left table','rows','key','all']),
 ('data','statistics','technical','How would you explain a p-value to a non-technical manager?',['null','probability','evidence','significance','chance','threshold']),
 ('data','data-cleaning','technical','You receive a messy dataset. Walk me through how you clean it.',['missing','duplicate','outlier','format','validate','document']),
 ('data','visualization','technical','How do you decide which chart to use for a given question?',['audience','trend','compare','distribution','simple','message']),
 ('data','python-pandas','technical','How do you aggregate data by group in pandas?',['groupby','agg','mean','sum','dataframe','reset_index']),
 ('aiml','ml-basics','technical','What is overfitting and how can you prevent it?',['training','validation','regularization','cross-validation','more data','simplify']),
 ('aiml','ml-basics','technical','How do you choose evaluation metrics for a classification problem?',['precision','recall','imbalance','f1','business','threshold']),
 ('aiml','deep-learning','technical','Explain backpropagation in simple terms.',['gradient','loss','chain rule','weights','update','layers']),
 ('aiml','nlp','technical','How does retrieval-augmented generation reduce hallucinations?',['retrieve','context','embedding','documents','prompt','grounded']),
 ('aiml','mlops','technical','How would you monitor a model after deployment?',['drift','metrics','latency','alert','retrain','logging']),
 (None,None,'hr','Tell me about yourself.',['background','skills','project','goal','experience','role']),
 (None,None,'hr','Describe a project you are proud of and your specific contribution.',['problem','role','result','challenge','team','learned']),
 (None,None,'hr','Tell me about a time you faced a difficult deadline or setback.',['situation','action','result','prioritize','communicate','learned']),
 (None,None,'hr','Why do you want this role and where do you see yourself in 3 years?',['interest','growth','company','skills','contribute','learn']),
]
out.append("insert into public.interview_questions(domain_id,skill_id,track,prompt,key_points)\nselect v.d, s.id, v.t, v.p, v.k from (values")
rows=[]
for d,s,t,p,k in I:
    rows.append(f"({q(d) if d else 'null::text'},{q(s) if s else 'null::text'},{q(t)},{q(p)},{arr(k)})")
out.append(",\n".join(rows))
out.append(") as v(d,s,t,p,k) left join public.skills s on s.domain_id=v.d and s.slug=v.s;\n")

open('../supabase/seed.sql','w').write("\n".join(out))
print(len(Q),'questions', len(R),'resources', len(J),'jobs')
