# RSATree

> https://gitlab.com/meihonghui/RSATree.git

#### VSCode

* **eslint**: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
  * ctrl + shift + P: ext install vscode-eslint
* **chrome debugger**: https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome
  * ctrl + shift + P: ext install debugger-for-chrome
  * add startup commend to chrome shotcut: --remote-debugging-port=9222
* **how to build and debug**
  * build: config tasks.json
    ```JSON
    {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "node preprocess",
          "type": "shell",
          "command": "node",
          "args": [
            "./index.js"
          ],
          "group": {
            "kind": "build",
            "isDefault": true
          },
          "presentation": {
            "reveal": "always",
            "panel": "dedicated"
          },
          "options": {
            "cwd": "${workspaceRoot}/preprocess/"
          },
          "problemMatcher": [
          ]
        }
      ]
    }
    ```
  * debug: config launch.json
    ```JSON
    {
      "version": "0.2.0",
      "configurations": [
        {
          "type": "node",
          "request": "launch",
          "name": "Node",
          "program": "${file}"
        }
      ]
    }
    ```

----
#### Database

* **Configuration**

  * ip
    > 10.76.0.193

  * username
    > username

  * password
    > password

  * database
    > rsatree

* **Contents**

  | Table name | # Records | # Dimensions | Original Location | Description |
  |:-------------:|:-------------:|:-------------:|:-------------:|:-------------:|
  | 2007csv_large | 14,715K | 30 | 10.76.0.190:3306/sat | # records is not the same as that in the original location(14,738,040) |
  | 2007csv_small | 104K | 30 | 10.76.0.190:3306/sat | # records is not the same as that in the original location(104859) |
  | 2007csvorigin | 14,241K | 30 | 10.76.0.190:3306/sat | # records is **far fewer** than that in the original location(14241418); **should be reconstructed again** |
  | blog | 92K | 7 | 10.76.0.184:3306/mobiledata | # records is not the same as that in the original location(89198) |
  | poi | 922K | 8 | 10.76.0.184:3306/mobiledata | # records is not the same as that in the original location(862635) |
  | poi_small | 92K | 8 | none | / |
  | poi_large | 834K | 8 | none | / |
  | yellow_tripdata_2017_01 | 9,614K | 18 | 10.76.0.190:3306/sat | # records is not the same as that in the original location(8819230) |
  | taxi_traj | 372,974K | 8 | 10.76.0.184:3306/mobiledata | **still being processed** |

* **Reconstruction Guide**

  * For taxi_traj

    1. Make sure there aren't any tables being inserted and you have **taxi_traj.sql**

    2. Delete original table in 10.76.0.193:3306/rsatree

    3. Open cmd, execute mysql

        ```Bash
        mysql -u root -p
        > use rsatree;
        > source taxi_traj.sql
        ```

  * For other tables except **taxi_traj.sql** that already exist in other database

    1. Tools: Navicat

    2. Delete original table in 10.76.0.193:3306/rsatree

    3. 工具 -- 数据传输 -- 选择源和目标 -- 下一步 -- 开始

  * For tables that do not exist yet, you need to build tables from scratch.

  * Separate a table into big part and small part
  `table_1`, `table_2` and `table_original` are self-defined; `seed` is random seed number(e.g. 1024); `ratio` is the percentage you set ranges from 0 to 1(e.g. 0.9).

    ```sql
    CREATE TABLE table_1 SELECT * FROM table_original HAVING RAND(seed) <= ratio;
    CREATE TABLE table_2 SELECT * FROM table_original HAVING RAND(seed) > ratio;
    ```

----

#### API

* **rbush**

  1. Import rbush package.

      ```Javascript
      import rbush from 'your_project_path/rbushClass';
      ```

  2. Generate an instance of rbush class.

      ```Javascript
      let rtree = rbush(maxEntries, dimension, binNum, {
        useHistogram: true,
        histogramBinNum,
        histogramDimension,
        dynamicDomain: false,
        align: false,
        // domain: domain, // use bounding box if not specified
      });
      ```

  3. Insert data points.

      ```Javascript
      loop:
        rtree.insert([+x, +y, +z]);
      ```

  4. Generate SAT in the instance rtree.

      ```Javascript
      rtree.generate();
      ```

  5. (**optional**) Insert data points (if you need to build tree progressively) after the bounding box of rtree is settled and update SAT inside.

      ```Javascript
      loop:
        rtree.insert2([+x, +y, +z]);
      rtree.generate2();
      ```

  6. Range search (`result` is an array if `histogramBinNum > 1`)

      ```Javascript
      let result = rtree.search([[x1, x2], [y1, y2], [z1, z2]]);
      ```

----

#### Performance Test Guide

* **Front-end construction scenario**

  * **Time cost of creation in once way**

      ```Javascript
      let createTime = 0;
      let startTime = window.performance.now();
      // TODO START
      let rtree = rbush(maxEntries, dimension, binNum, options);
      for (let point of points) {
        rtree.insert(point);
      }
      rtree.generate();
      // TODO END
      createTime += (window.performance.now() - startTime);
      ```

  * **Time cost of creation in progressive way**

      Note that we should only consider time cost on `insert` and `insert2`. Time cost of asynchronous operation should not be consider.

      ```Javascript
      let createTime = 0;
      let startTime = window.performance.now();
      // TODO START
      // Phase 1 start
      let rtree = rbush(maxEntries, dimension, binNum, options);
      for (let point of points) {
        rtree.insert(point);
      }
      rtree.generate();
      // Phase 1 end

      createTime += (window.performance.now() - startTime);
      // Something else happens in-between, like asynchronous request for data
      // e.g. points = await getMoreData();
      startTime = window.performance.now();

      // Phase 2 start
      for (let point of points) {
        rtree.insert2(point);
      }
      rtree.generate2();
      // Phase 2 end
      // TODO END
      createTime += (window.performance.now() - startTime);
      ```

  * **Time cost of searching**

      You can expand for loop to n-dimension case, but should only wrap `search` function inside testing code. Since time cost varies a lot with one single run, we need to **run this test multiple times**, like 100.

      ```Javascript
      let searchTime = 0;
      // Here we use heatmap scenario as example, which is a 2-dimension case;
      for (let i = 0; i < binNum[1]; i += 1) {
        for (let j = 0; j < binNum[0]; j += 1) {
          let startTime = window.performance.now();
          let result = rtree.search([[x1, x2], [y1, y2]])
          searchTime += (window.performance.now() - startTime);
          // TODO something else
        }
      }
      ```

  * **Memory usage of a tree**

      ```bash
      npm install object-sizeof
      ```

      ```Javascript
      import sizeof from 'object-sizeof';
      let createHeap = sizeof(rtree);
      ```

  * **Memory usage of approximate cube**

      ```Javascript
      import sizeof from 'object-sizeof';
      let searchHeap = sizeof(approximateCube);
      ```

  * **error of tree**

      Generally we need to evaluate 4 kinds of error metrics: max error, median error, average error and error matrix(only for 2-dimension senario, higher dimension scenario is hard to visualize).

      ```Javascript
      // error matrix evaluation(2D case)
      import error from './error';
      let errorInfo = error.computeError(preciseMatrix, approximateMatrix, boundingbox, heatmapRes, errorType);
      ```

      Note that `errorType` takes up 3 choices: `relative`, `SSE` and `absolute`. For **each given grid**, the equation for these 3 choices is:

      ```Javascript
      // relative
      let c = Math.abs(a - b);
      let error = (c === 0 || c < 0.0001) ? 0 : c / Math.max(a, b);

      // SSE
      let error = Math.abs(a - b);
      error = Math.pow(err, 2);

      // absolute
      let error = Math.abs(a - b);
      ```

* **Back-end construction scenario**
  
  * **Time cost of creation in once way**

      ```Javascript
      // require Performance Timing API
      const { performance } = require('perf_hooks');
      let createTime = 0;
      let startTime = performance.now();
      // TODO START
      let rtree = rbush(maxEntries, dimension, binNum, options);
      for (let point of points) {
        rtree.insert(point);
      }
      rtree.generate();
      // TODO END
      createTime += (performance.now() - startTime);
      ```

  * **Time cost of creation in progressive way**

      Note that we should only consider time cost on `insert` and `insert2`. Time cost of asynchronous operation should not be consider.

      ```Javascript
      // require Performance Timing API
      const { performance } = require('perf_hooks');
      let createTime = 0;
      let startTime = performance.now();
      // TODO START
      // Phase 1 start
      let rtree = rbush(maxEntries, dimension, binNum, options);
      for (let point of points) {
        rtree.insert(point);
      }
      rtree.generate();
      // Phase 1 end

      createTime += (performance.now() - startTime);
      // Something else happens in-between, like asynchronous request for data
      // e.g. points = await getMoreData();
      startTime = performance.now();

      // Phase 2 start
      for (let point of points) {
        rtree.insert2(point);
      }
      rtree.generate2();
      // Phase 2 end
      // TODO END
      createTime += (performance.now() - startTime);
      ```

  * **Time cost of searching**

      Since we construct `rtree` in back-end and do range seraching in the front-end, the code is the same as one in **Front-end construction scenario**.

  * **Memory usage of a tree**

      The code is the same as one in **Front-end construction scenario**.

  * **Memory usage of approximate cube**

      The code is the same as one in **Front-end construction scenario**.

  * **error of tree**

      The code is the same as one in **Front-end construction scenario**.

* **Notes & Tips**

  * Generally, we need to test our algorithm on 6 aforementioned metrics above.

  * Note that we do not need to evaluate all of them in a single run because:
    1. `sizeof` takes up huge time when data structure is very complex;
    2. When we compare efficiency, sometimes some error metrics(like error metric) does not need to be considered and we might only focus on *ARE* rate;
  
  * Specifically, we like to test metrics against the height of the tree(`treeHeight`, which is first converted to `maxEntries` and then passed to `rbush` constructor). Since there isn't any precise equation that determines the relationship between them, we need to adjust `treeHeight` to set `rtree.data.height` to the expected value. **Make sure you record the mapping of `treeHeight` to `rtree.data.height`**

  * Another independent variable is the bin number of SAT. Note that we are supposed to use different value set for different scenario given that the size of datacube is different. For reference, `[8, 16, 32, 48, 64]` is ok for Heatmap scenario and `[4, 6, 8, 10]` may be proper for Binned and BrushingAndLinking(I am not sure about this).

  * Note that there is a hyper parameter, `binNum` of the view(like `heatmapRes` is Heatmap). We should make sure this value fixed across the test. `64, 128` are preferred.

  * We may need to run test in the `align: true` case and `align: false` case.

  * We may also need to consider `hash` and `dynamicDomain` configuration.

----

TODO List

* 将R-tree、SAT、LSH等从frontend移动到src（公用代码）

  * 相关node module（待完成后移除package.json)
    * object-sizeof
    * static-kdtree
    * ndarray
    * typedarray-pool