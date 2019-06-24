#ifndef BASASUYA_QUERY_H
#define BASASUYA_QUERY_H

#include <stdlib.h>
#include <time.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <unistd.h>
#include <ctime>
#include <iostream>
#include <map>
#include <memory>
#include <ctime>
#include <cstring>
#include <nlohmann/json.hpp>
#include "RTree.h"
#include "timer.h"
#include "parse.h"

const int MM = 20;

template <int INNDIMS, class INNTYPE, int NUMDIMS, class ELEMTYPE, class ELEMTYPEREAL, int TMAXNODES, int TMINNODES, int LEAFMAX, int LEAFMIN, class DATATYPE>
class Query {
private:
    float maxx[MM];
    float minn[MM];
    int scaleMax[MM];
    int scaleMin[MM];

    float minEdge[MM];
    float maxEdge[MM];
    int minEdgescale[MM];
    int maxEdgescale[MM];

    int insertData[MM];

    float ask1[MM];
    float ask2[MM];
    int Ask1[MM], Ask2[MM];
    int answer[100];
    
    RTree<INNDIMS, INNTYPE, NUMDIMS, ELEMTYPE, ELEMTYPEREAL, TMAXNODES, TMINNODES, LEAFMAX, LEAFMIN, DATATYPE> tree;
    satStruct satSet;

    int queryTimes;
    json json_obj;
    
private: 
    void InsertProcess(string file, int choose, int limitNum = -1, int printSplit = 500000) {
        clock_t t1 = clock();
        printf("choose insert type: %d\n", choose);
        int cnt = 0;
        int n, m, l;
        RTFileStream stream;
        
        // FILE* csvWrite = fopen("./gps.csv", "w"); //basasuya
        
        // fprintf(csvWrite, "latitude,longitude,time,speed,direction\n"); // basasuya
        if (!stream.OpenRead(file.c_str())) {
            exit(0);
        }
        int dataFileId;
        stream.Read(dataFileId); stream.Read(n);
        stream.Read(m); stream.Read(l);
        printf("rows: %d outdim: %d inndim: %d\n", n, m, l);
        if(limitNum != -1) n = limitNum;
        for(int i = 0; i < n; ++i) {
            int ok = true;
            for(int j = 0; j < m; ++j) {
                stream.Read(minEdge[j]);
                maxEdge[j] = minEdge[j];
                if(minEdge[j] < minn[j] || minEdge[j] > maxx[j]) ok = false;
                // if(j < 2) fprintf(csvWrite, "%.3f%c", maxEdge[j], j == (m-1) ? '\n' : ','); // basasuya
                // else fprintf(csvWrite, "%d%c", (int)maxEdge[j], j == (m-1) ? '\n' : ','); // basasuya
            }
            for(int j = 0, offset = 0; j < satSet._dimInnNum; ++j) {
                float tmp; stream.Read(tmp);
                if(satSet._innDivideNum[j] == -1) {
                    insertData[offset] = tmp;
                    offset += 1;
                    continue;
                }
                for(int k = 0; k < satSet._innDivideNum[j]; ++k) {
                    insertData[offset + k] = (k == tmp);
                }
                offset += satSet._innDivideNum[j];
            }

            if(ok == false) {
                printf("there is a number out of range\n");
                continue;
            }

            for(int j = 0; j < satSet._dimCoordinate; ++j) {
                minEdgescale[j] = scaleMin[j] + floor( (scaleMax[j] - scaleMin[j]) / (maxx[j] - minn[j]) *  (minEdge[j] - minn[j])  );
                maxEdgescale[j] = minEdgescale[j]; 
            }
            if(choose == 0) tree.Insert(minEdgescale, maxEdgescale, cnt, insertData);
            else if(choose == 1) tree.InsertChangeRect(minEdgescale, maxEdgescale, insertData);
            else tree.InsertNotModify(minEdgescale, maxEdgescale, insertData);
            
            cnt ++;
            if(cnt % printSplit == 0) {
                printf("have insert %d funciton for %d times\n", choose, cnt);
                for(int j = 0; j < satSet._dimCoordinate; ++j) printf("%d ", minEdgescale[j]);
                for(int j = 0; j < satSet._dimInner; ++j) printf("%d " , insertData[j]); printf("\n");
            }
        }
        printf("have insert %d times\n", cnt);
        stream.Close();
        printf("insert Time: %.3f s\n",(clock() - t1) * 1.0 / CLOCKS_PER_SEC);
    
        // fclose (csvWrite); // basasuya
    }

public:
    Query(string jsonfile, int argc, char **argv) {
        std::ifstream input(jsonfile);
        
        input >> json_obj;

        satSet._allDomain_min = scaleMin;
        satSet._allDomain_max = scaleMax;
        parseParameter(json_obj, &satSet, minn, maxx, &queryTimes);
        satSet.setParam(argc, argv);

        tree.copy(satSet);
    }




    void load(string file) {
        string t1 = "./result/" + file + "Rtree";
        tree.LoadRTree(t1.c_str(), satSet);

        string t2 = "./result/" + file + "SAT";
        tree.LoadSAT(t2.c_str(), satSet);
    }

    void save(string file) {
        string t1 = "./result/" + file + "Rtree";
        tree.SaveRTree(t1.c_str());

        string t2 = "./result/" + file + "SAT";
        tree.SaveSAT(t2.c_str());
    }

    void insert(string file1) {
        clock_t t1 = clock();

        InsertProcess(file1, 0);
        tree.initSAT(satSet);
        tree.generate();
    
        printf("All Time: %.3f s\n",(clock() - t1) * 1.0 / CLOCKS_PER_SEC);
    }

    void insert(string file1, string file2) {
        clock_t t1 = clock();
        
        InsertProcess(file1, 0);
        InsertProcess(file2, 1);
        tree.initSAT(satSet);
        InsertProcess(file2, 2);
        printf("insert Time: %.3f s\n",(clock() - t1) * 1.0 / CLOCKS_PER_SEC);
        tree.generate();

        

        printf("All Time: %.3f s\n",(clock() - t1) * 1.0 / CLOCKS_PER_SEC);
    }

    void query(int printSplit = 100) {
        // Ask1[0] = 0; Ask2[0] = 1800; Ask1[1] = 0; Ask2[1] = 1800;
        // int *tmp = tree.allAsk(Ask1, Ask2);
        // for(int i = 0; i < satSet._dimInner; ++i) printf("%d \n", tmp[i]); printf("\n");
        // return;

        clock_t t1 = clock();
        int lessNum = 0; 
        float falseRatio = 0; float largeFalseRatio = -1; float falseOffset = 0;
        // for(int hh = 0; hh < 100; ++hh)
        for (int i = 0, tot = 1; i < queryTimes; ++i, tot ++) {
            parseQuery(json_obj, &satSet, Ask1, Ask2, answer, i);
        
            int *tmp = tree.Ask(Ask1, Ask2); 
            // for (int j = 0; j < satSet._dimInner; ++j) {
            //     falseOffset += tmp[j] - answer[j];
            //     float ratio = abs(tmp[j] - answer[j])*1.0 / answer[j];
            //     falseRatio += ratio;
            //     largeFalseRatio = max(ratio, largeFalseRatio);
            //     if(tmp[j] < answer[j]) lessNum ++;
            // }
            // if(tot % printSplit == 0) {
            //     for(int j = 0; j < satSet._dimCoordinate; ++j) printf(" %d %d |", Ask1[j], Ask2[j]); printf("\n");
            //     for(int j = 0; j < satSet._dimInner; ++j) printf("%d %d |", tmp[j], answer[j]); printf("\n"); 
            // }
        }
        // falseRatio /= satSet._dimInner;
        // printf("falseRatio: %.5f largeFalseRatio: %.5f falseOffset: %.5f lessRatio %.5f\n", falseRatio, largeFalseRatio, falseOffset, lessNum * 1.0 / queryTimes);
        printf("query Time: %.9f s\n",(clock() - t1) * 1.0 / CLOCKS_PER_SEC);
    }
    void spolmQuery() {
        int edge = satSet._allDomain_max[0];
        clock_t t1 = clock();
        for(int i = NUMDIMS - 1; i >= 2; --i) {
            Ask1[i] = 0; Ask2[i] = edge; 
        }
        int cnt = 0;
		for(int z = 0; z < 100; ++z) {
        for(int i = 1; i <= edge; i += 1) {
           for(int j = 1; j <= edge; j += 1) {
                Ask1[0] = i; Ask2[0] = i;
                Ask1[1] = j; Ask2[1] = j;
                int *tmp = tree.Ask(Ask1, Ask2); 
                cnt ++;
            // printf("%d\n", cnt);
                // if(cnt % 100 == 0) {
                //     for(int z = 0; z < satSet._dimCoordinate; ++z) printf(" %d %d |", Ask1[z], Ask2[z]); printf("\n");
                //     for(int z = 0; z < satSet._dimInner; ++z) printf("%d ", tmp[z]); printf("\n"); 
                // }
            }
        }
		}
		printf("query times: %d\n", cnt);
        
        printf("query Time: %.6f s\n",(clock() - t1) * 1.0 / CLOCKS_PER_SEC);
    }
};




#endif
