
#include <stdlib.h>
#include <time.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <unistd.h>
#include <ctime>
#include <iostream>
#include <fstream>
#include <map>
#include <memory>
#include <ctime>
#include <cstring>
#include <nlohmann/json.hpp>
#include "RTree.h"
#include "timer.h"
#include "parse.h"

using json = nlohmann::json;
using namespace std;
const int MM = 20;

int scaleMax[MM];
int scaleMin[MM];
float maxx[MM];
float minn[MM];
float minEdge[MM];
float maxEdge[MM];
int ask1[10005][MM];
int ask2[10005][MM];
int answer[10005];
int minEdgescale[MM];
int maxEdgescale[MM];
int randDomain;
json json_obj;
satStruct satSet;
// char readDomain[200] = "parameterBrightkite_1.txt";
char readData[200] = "xianParameter.json";
// int times = 1000;
void setParams(int argc, char ** argv) {
    int i;
    // if ((i = ArgPos((char *) "-readDomain", argc, argv)) > 0) strcpy(readDomain, argv[i + 1]);
    if ((i = ArgPos((char *) "-readData", argc, argv)) > 0) strcpy(readData, argv[i + 1]);
    // if ((i = ArgPos((char *) "-time", argc, argv)) > 0) times = atoi(argv[i + 1]);
    if ((i = ArgPos((char *) "-rand", argc, argv)) > 0) randDomain = atoi(argv[i + 1]);
}



void test(string readData, int nums = -1) {
    
    string tt = "./data/" + readData;
    RTFileStream stream;
    if (!stream.OpenRead(tt.c_str())) {
        printf("can't open the file\n");
        exit(0);
    }
    int dataFileId = ('O' << 0) | ('R' << 8) | ('I' << 16) | ('D' << 24);
    int n, m, l;
    stream.Read(dataFileId);
    stream.Read(n); stream.Read(m); stream.Read(l);
    int cnt1 = 0; int cnt2 = 0;
    printf("%d %d %d\n", n, m, l);
    int readCnt = 0;
    // n = 2000000;
    if(nums != - 1) n = nums;
    printf("read for %d\n", n);
    for(int i = 0; i < n; ++i) {
        for(int j = 0; j < m + l; ++j) {
            stream.Read(minEdge[j]);   
            maxEdge[j] = minEdge[j]; 
        }
        for(int j = 0; j < satSet._dimCoordinate; ++j) {
            minEdgescale[j] = scaleMin[j] + floor( (scaleMax[j] - scaleMin[j]) / (maxx[j] - minn[j]) *  (minEdge[j] - minn[j])  );
            maxEdgescale[j] = scaleMin[j] + floor( (scaleMax[j] - scaleMin[j]) / (maxx[j] - minn[j]) *  (maxEdge[j] - minn[j])  ); 
        }
        for(int i = 0; i < json_obj["queryTimes"].get<int>(); ++i) {
            bool flag = true;
            for(int j = 0; j < satSet._dimCoordinate && flag; ++j) {
                if(minEdgescale[j] < ask1[i][j] || maxEdgescale[j] > ask2[i][j]) flag = false;
            }
            if(flag) answer[i] ++;
        }
        readCnt ++;
        if(readCnt % 1000000 == 0) {
            for(int j = 0; j < satSet._dimCoordinate; ++j) printf("%.3f ", minEdge[j]); printf("\n");
        }
    }
}


int main(int argc, char ** argv) {
    setParams(argc, argv);
    srand (time(NULL));
    randDomain = 30000;
    setParams(argc, argv);
    
    std::ifstream input("json/xianParameter.json");
    
    // printf("%d\n", num);
    input >> json_obj;

    satSet._allDomain_min = scaleMin;
    satSet._allDomain_max = scaleMax;
    int q;
    parseParameter(json_obj, &satSet, minn, maxx, &q);
    satSet.setParam(argc, argv);

    for(int i = 0; i < json_obj["queryTimes"].get<int>(); ++i) {
        for(int j = 0; j < satSet._dimCoordinate; ++j) {
            float t1 = (maxx[j] - minn[j]) * (1 -(rand() % randDomain)*1.0 / 100000) + minn[j];
            float t2 = (maxx[j] - minn[j]) * ((rand() % randDomain)*1.0 / 100000) + minn[j];
            if (t1 > t2) swap(t1, t2);
            ask1[i][j] = scaleMin[j] + floor( (scaleMax[j] - scaleMin[j]) / (maxx[j] - minn[j]) *  (t1 - minn[j])  );
            ask2[i][j] = scaleMin[j] + floor( (scaleMax[j] - scaleMin[j]) / (maxx[j] - minn[j]) *  (t2 - minn[j])  ); 
        }
    }

    // for(int i = 0; i < 5; ++i) printf(" %.3f %.3f | ", minn[i], maxx[i]); printf("\n");

    
    test("Xian_Data");
    // fprintf(paraStream, "%d\n", times);

    // for(int i = 0; i < times; ++i) {
    //     for(int j = 0; j < satSet._dimCoordinate; ++j) {
    //         fprintf(paraStream, "%d %d ", ask1[i][j], ask2[i][j]);
    //     }
    //     fprintf(paraStream, "%d\n", answer[i]);
    // }
    json_obj["queryAnswer"].clear();
    json_obj["queryScale"].clear();
    json_obj["queryScale"] = nlohmann::json::array();
    json_obj["queryAnswer"] = nlohmann::json::array();
    for(int i = 0; i < json_obj["queryTimes"].get<int>(); ++i) {
        std::vector<int> singleScale;
        for(int j = 0; j < satSet._dimCoordinate; ++j) {
            // fprintf(paraStream, "%d %d ", ask1[i][j], ask2[i][j]);
            singleScale.push_back(ask1[i][j]);
            singleScale.push_back(ask2[i][j]);
        }
        json_obj["queryScale"].push_back(singleScale);
        // fprintf(paraStream, "%d\n", answer[i]);
        json_obj["queryAnswer"].push_back(answer[i]);
    }

    std::ofstream o( "tmpJson/" + string(readData) );
    o << json_obj;
    // fclose(paraStream);
    return 0;
}