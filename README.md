# RSATree: Distribution-Aware Data Representation of Large-Scale Tabular Datasets for Flexible Visual Query

RSATree is a novel data representation, which supports flexible approximate query of large-scale tabular datasets and interactive interface in different scenarios. The project is developed by [Visual Analytics Group](<https://zjuvag.org/>) from [State Key Lab of CAD&CG]((http://www.cad.zju.edu.cn/english.html)), Zhejiang University, China.

<img src='./docs/algorithm.png'>

## Citation

We have written a [paper](<https://ieeexplore.ieee.org/document/8807303>) about the research behind RSAtree which was accepted by [IEEE VIS 2019](<http://ieeevis.org/year/2019/welcome>),  Please cite us if you use it in a publication.

```bib
@ARTICLE{8807303, 
    author={H. {Mei} and W. {Chen} and Y. {Wei} and Y. {Hu} and S. {Zhou} and B. {Lin} and Y. {Zhao} and J. {Xia}}, 
    journal={IEEE Transactions on Visualization and Computer Graphics}, 
    title={RSATree: Distribution-Aware Data Representation of Large-Scale Tabular Datasets for Flexible Visual Query}, 
    year={2019}, 
    volume={}, 
    number={}, 
    pages={1-1}, 
    keywords={Visualization;Data visualization;Aggregates;Histograms;Time factors;Visual databases;Social networking (online);Aggregate query;visual query;large-scale data visualization;R-tree;summed area table;hashing}, 
    doi={10.1109/TVCG.2019.2934800}, 
    ISSN={}, 
    month={},
}
```

## Build and Run

We are open two demos about our algorithm. 

Our coding environment is **ubuntu 18.04** with **32GB** RAM, 500GB SSD

C++ version is **gcc 7.4.0**, node version is **v10.16.0**, cmake version is **3.10.2**

#### Construct the data structure

First you need to install a library for reading json files

I uses the library from https://github.com/nlohmann/json.git

```
git clone https://github.com/nlohmann/json.git
cd json
mkdir build
cd build
cmake ..
make -j8
sudo make install
```

there is a template about how to builld BRIGHTKITE datasets using C++

I have prepared a smaller binary file of BRIGHTKITE in folder `./construct/data `

```bash
cd construct
mkdir result
mkdir build
bash build.sh
./solveBrightkiteDays
cp result/* ../backend/data/BRIGHTKITE
```

#### Install libraries using npm

```bash
cd frontend
npm install
npm audit fix 
cd ../backend
npm install
npm audit fix
```

#### Run the server

```bash
# start frontend 
cd frontend
npm run debug


# then start a new terminal then start backend 
cd backend
npm run start
```

you will see the website on <http://localhost:8081/>

