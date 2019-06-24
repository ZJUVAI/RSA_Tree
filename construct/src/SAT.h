#ifndef BASASUYA_SAT_H
#define BASASUYA_SAT_H

#include <cmath>
#include <cstdio>
#include <vector>
#include "File.h"
#include "Tool.h"
using namespace std;



struct satStruct {
    int _dimInnNum;
    bool _useExpand;
    bool _useHash;
    bool _useLayer;
    int _layerMul;
    int* _sumTable;
    int _partInsert;
    int _satNum;
    int _totalInsert;
    int _dimCoordinate;
    int* _cooDivideNum;
    int* _cooLimitLength;
    int _dimInner;
    int* _innDivideNum;
    int* _domain_min;
    int* _domain_max;
    int* _allDomain_min;
    int* _allDomain_max;
    bool _userHistgram;
    bool _insertThenUpate;
    bool _dynamicDivide;
    bool _useDiffernce;
    int _useForSplit;
    void read() {
        _cooDivideNum = new int[_dimCoordinate];
        _cooLimitLength = new int[_dimCoordinate];
        _innDivideNum = new int[_dimInnNum];

        for (int i = 0; i < _dimCoordinate; ++i) {
            scanf("%d", &_cooLimitLength[i]);
        }
        for (int i = 0; i < _dimCoordinate; ++i) {
            scanf("%d", &_cooDivideNum[i]);
        }
        _dimInner = 0;
        for(int i = 0; i < _dimInnNum; ++i) {
            scanf("%d", &_innDivideNum[i]);
            _dimInner += _innDivideNum[i];
        }
        
        for(int  i= 0; i < _dimCoordinate; ++i) printf("%d ", _cooDivideNum[i]); printf("\n");
        // for(int i = 0; i < _dimInner; ++i) printf("%d ", _innDivideNum[i]); printf("\n");

        int tmp1, tmp2, tmp3, tmp4, tmp5;
        scanf("%d", &tmp2);
        _useHash = tmp2 == 1;
        scanf("%d %d", &tmp4, &_layerMul);
        printf("useHash: %d layerMul : %d\n", _useHash, _layerMul);
        _useLayer = tmp4 == 1;
    }
    void read(FILE* paraStream) {
        _cooDivideNum = new int[_dimCoordinate];
        _cooLimitLength = new int[_dimCoordinate];
        _innDivideNum = new int[_dimInnNum];

        for (int i = 0; i < _dimCoordinate; ++i) {
            fscanf(paraStream,"%d", &_cooLimitLength[i]);
        }
        for (int i = 0; i < _dimCoordinate; ++i) {
            fscanf(paraStream,"%d", &_cooDivideNum[i]);
        }
        _dimInner = 0;
        for(int i = 0; i < _dimInnNum; ++i) {
            fscanf(paraStream, "%d", &_innDivideNum[i]);
            _dimInner += _innDivideNum[i];
        }
        
        for(int  i= 0; i < _dimCoordinate; ++i) printf("%d ", _cooDivideNum[i]); printf("\n");
        // for(int i = 0; i < _dimInner; ++i) printf("%d ", _innDivideNum[i]); printf("\n");

        int tmp1, tmp2, tmp3, tmp4, tmp5;
        fscanf(paraStream,"%d %d %d %d", &tmp1, &tmp2, &tmp3, &_layerMul);
        _useHash = tmp1 == 1;
        _useDiffernce = tmp2 == 1;
        _useLayer = tmp3 == 1;
    }
    void setParam(int argc, char ** argv) {
        int i;
        if ((i = ArgPos((char *) "-hash", argc, argv)) > 0) _useHash= atoi(argv[i + 1]); 
        if ((i = ArgPos((char *) "-diff", argc, argv)) > 0) _useDiffernce = atoi(argv[i + 1]);

        printf("layer: %d Mul: %d hash: %d diff: %d\n", _useLayer,  _layerMul, _useHash, _useDiffernce);
        printf("useForSplit: %d\n", _useForSplit);
    }
    ~satStruct() {
        delete[] _cooDivideNum;
        delete[] _innDivideNum;
        delete[] _cooLimitLength;
    }
};

const int bestDivideLength[100] = {1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24, 30, 36, 40, 48, 60, 72, 90, 96, 100, 120, 144, 180, 200, 216, 240, 288, 300, 360, 432, 480, 600, 720, 864, 900, 960, 1080, 1200, 1296, 1440, 1800, 2160, 2400, 2592, 2880, 3600, 4320, 4800, 5400, 5760, 6480, 7200, 8640, 10800, 11520, 12960, 14400, 17280, 21600, 23040, 25920, 28800, 32400, 34560, 36000, 43200, 51840, 57600, 64800, 69120, 72000, 77760, 86400, 103680, 108000, 115200, 129600, 138240, 144000, 155520, 172800, 207360, 216000, 259200, 288000, 311040, 324000, 345600, 388800, 414720, 432000, 466560, 518400, 576000, 622080, 648000};

template <class ELEMTYPE, class INNTYPE, int INNDIMS, int NUMDIMS>
class SAT {
   private:
    INNTYPE *sumTable;
    int dimCoordinate;
    int cooDivideNum[NUMDIMS];
    ELEMTYPE cooDivideLength[NUMDIMS];

    int dimInner;
    vector<ELEMTYPE> satOut[NUMDIMS];
    vector<INNTYPE> satInn[INNDIMS];
    vector<ELEMTYPE> outHasTable[NUMDIMS];
    int query[NUMDIMS][65];

    bool userHistgram;
    bool insertThenUpate;
    bool dynamicDivide;
    int partInsert;
    int satNum;
    int totalInsert;
    // bool useTag;
    int tableSize;
    bool useHash;
    bool useDifference;

    int insertTimes;

   public:
    
    ELEMTYPE domain_min[NUMDIMS];
    ELEMTYPE domain_max[NUMDIMS];
   
   private:
    inline int getId(int* corId) {
        int tmp = 0;
        for (int i = 0; i < dimCoordinate; ++i) {
            if(corId[i] < 0) return 0;
        //    printf("%d/%d ", corId[i], cooDivideNum[i]);
            // assert(corId[i] < cooDivideNum[i]);
            tmp = (i ? cooDivideNum[i] : 1) * tmp + corId[i];
        }
    //    printf(" :%d %d\n", tmp * dimInner, tableSize);
        
        // assert(tmp * dimInner < tableSize);
        return tmp * dimInner;
    }
    int getId(int* corId, int offset) {
        int tmp = 0;
        for (int i = 0; i < dimCoordinate; ++i) {
            if(corId[i] < 0) return 0;
            // printf("%d/%d ", corId[i], cooDivideNum[i]);
            // assert(corId[i] < cooDivideNum[i]);
            tmp = (i ? cooDivideNum[i] : 1) * tmp + corId[i];
        }
    //    printf(" :%d %d\n", tmp * dimInner, tableSize);
        
        // assert(tmp * dimInner < tableSize);
        return sumTable[tmp * dimInner + offset];
    }
    inline void update(const ELEMTYPE* corData, const INNTYPE* innData) {
        insertTimes ++;
        int IDD[NUMDIMS];
        int tmp = 0;
        for (int i = 0; i < dimCoordinate; ++i) {
            // if(corData[i] < domain_min[i] || corData[i] > domain_max[i]) {
            //     printf("xxxx\n");
            //     exit(0);
            //     return;
            // }
            int id = (corData[i] - domain_min[i]) / cooDivideLength[i];
            IDD[i] = id;
            // printf("%d %d %d | ", id, corData[i], domain_min[i]);
            // assert(id < cooDivideNum[i]);
            tmp = (i ? cooDivideNum[i] : 1) * tmp + id;
        }
        // printf("\n");
        tmp *= dimInner;
        for (int i = 0; i < dimInner; ++i) {
            // if(tmp + i >= tableSize) {
            //     for(int j = 0; j < dimCoordinate; ++j) printf("%d ", IDD[j]); printf("\n");
            //     printf("tableSize: %d %d\n", tmp + i, tableSize);
            //     exit(0);
            // }
            // assert(tmp+i < tableSize);
            sumTable[tmp + i] += innData[i];
        }
    }

    inline void updateHash(const ELEMTYPE* corData, const INNTYPE* innData){
        insertTimes ++;
        int tmp = 0;
        for(int i = 0; i < NUMDIMS; ++i) {
            int id = lower_bound(query[i], query[i] + cooDivideNum[i], corData[i]) - query[i];
            // if(id >= cooDivideNum[i]) {
            //     printf("%d %d %d\n", cooDivideNum[i], corData[i], domain_max[i]);
            //     assert(0);
            // }
            tmp = (i ? cooDivideNum[i] : 1) * tmp + id;
        }
        tmp *= dimInner;
        for (int i = 0; i < dimInner; ++i) {
            // assert(tmp+i < tableSize);
            sumTable[tmp + i] += innData[i];
        }
    }
    float Difference(int* choose, float* tmpCnt, int offset, int dim) {
        if(dim == NUMDIMS) return getId(choose, offset); 
        else if( abs(tmpCnt[dim] - round(tmpCnt[dim])) < 0.2 ) {
            choose[dim] = round(tmpCnt[dim]);
            return Difference(choose, tmpCnt, offset, dim + 1);
        }
        else {
            // printf("%d %d %d %.5f\n", dim, cooDivideLength[dim], cooDivideNum[dim], tmpCnt[dim]);
            int minn = (int) tmpCnt[dim];  
            int maxx = minn + 1;
            float ratio = tmpCnt[dim] - minn;
            choose[dim] = minn;
            int answer1 = Difference(choose, tmpCnt, offset, dim + 1);
            choose[dim] = maxx;
            int answer2 = Difference(choose, tmpCnt, offset, dim + 1);
            return (1 - ratio) * answer1 + ratio * answer2; 
        }   
    }

   public:
    SAT() {
        for(int i = 0; i < NUMDIMS; ++i) satOut[i].clear(), outHasTable[i].clear();
        for(int i = 0; i < INNDIMS; ++i) satInn[i].clear();
    }
    void init(satStruct& A) { // use in the recontruct SAT from the function(LoadSAT) int RTree.h
        sumTable = A._sumTable;
        dimCoordinate = A._dimCoordinate;
        dimInner = A._dimInner;
        useHash = A._useHash;
        useDifference = A._useDiffernce;
    }
    void print() {
        for(int i = 0; i < dimCoordinate; ++i) printf("%d %d | ", domain_min[i], domain_max[i]); printf("\n");
        for(int i = 0; i < dimCoordinate; ++i) printf("%d ", cooDivideLength[i]); printf("\n");
        for(int i = 0; i < dimCoordinate; ++i) printf("%d ", cooDivideNum[i]); printf("\n");
        printf("%d\n", satOut[0].size());
        for(int i = 0; i < dimInner; ++i) {
            int maxx = -1;
            for(int j = 0; j < satInn[i].size(); ++j) {
                // minn = min(minn, satInn[i][j]);
                maxx = max(maxx, satInn[i][j]);
            }
            printf("%d ", maxx);
        }
        printf("\n");
    }
    int read(RTFileStream& a_stream) {
        a_stream.Read(tableSize);
        a_stream.Read(insertTimes);
        a_stream.ReadArray(domain_min, NUMDIMS);
        a_stream.ReadArray(domain_max, NUMDIMS);
        a_stream.ReadArray(cooDivideNum, NUMDIMS);
        a_stream.ReadArray(cooDivideLength, NUMDIMS);
        a_stream.ReadArray(sumTable, tableSize);
        if(useHash) {
            for(int i = 0; i < dimCoordinate; ++i) {
                a_stream.ReadArray(query[i], cooDivideNum[i]);
            }
        }
        // for(int i = 0; i < NUMDIMS; ++i) printf("%d ", domain_min[i]); printf("\n");
        return tableSize;
    }
    void save(RTFileStream& a_stream) {
        a_stream.Write(tableSize);
        a_stream.Write(insertTimes);
        a_stream.WriteArray(domain_min, NUMDIMS);
        a_stream.WriteArray(domain_max, NUMDIMS);
        a_stream.WriteArray(cooDivideNum, NUMDIMS);
        a_stream.WriteArray(cooDivideLength, NUMDIMS);
        a_stream.WriteArray(sumTable, tableSize);
        // for(int i = 0; i < NUMDIMS; ++i) printf("%d ", domain_min[i]); printf("\n");
        if(useHash) {
            for(int i = 0; i < dimCoordinate; ++i) {
                a_stream.WriteArray(query[i], cooDivideNum[i]);
            }
        }
        // for(int i = 0; i < NUMDIMS; ++i) printf("%d ", domain_min[i]); printf("\n");
    }
    void saveCooDivideNum(RTFileStream& a_stream) {
        a_stream.WriteArray(cooDivideNum, NUMDIMS);
    }
    void saveDomain(RTFileStream& a_stream) {
        a_stream.WriteArray(domain_min, NUMDIMS); 
        for(int i = 0; i < NUMDIMS; ++i) domain_max[i] ++; 
        a_stream.WriteArray(domain_max, NUMDIMS); 
        for(int i = 0; i < NUMDIMS; ++i) domain_max[i] --; 
        // for(int i = 0; i < NUMDIMS; ++i) printf("%d %d | ", domain_min[i], domain_max[i]); printf("\n");

    }
    int copyHash(satStruct& A) {
        insertTimes = 0;
        sumTable = A._sumTable;
        dimCoordinate = A._dimCoordinate;
        dimInner = A._dimInner;
        useHash = true;
        // for(int i = 0; i < dimCoordinate; ++i) printf("%d %d | ", A._domain_min[i], A._domain_max[i]); printf("\n");
        for (int i = 0; i < dimCoordinate; ++i) cooDivideNum[i] = A._cooDivideNum[i];
        for (int i = 0; i < dimCoordinate; ++i) {
            domain_min[i] = A._domain_min[i] - (A._useExpand ? (A._domain_max[i] - A._domain_min[i]) / 1000 : 0);
            domain_max[i] = A._domain_max[i] + (A._useExpand ? (A._domain_max[i] - A._domain_min[i]) / 1000 : 0);
        }
        // for(int i = 0; i < dimCoordinate; ++i) printf("%d %d | ", domain_min[i], domain_max[i]); printf("\n");

        for(int i = 0; i < NUMDIMS; ++i) {
            
            for(int j = 0; j < satOut[i].size(); ++j) {
                outHasTable[i].push_back(satOut[i][j]);
                // assert(domain_min[i] <= satOut[i][j]);
                // assert(domain_max[i] >= satOut[i][j]);
            }
            outHasTable[i].push_back(domain_min[i]);
            outHasTable[i].push_back(domain_max[i]);
            sort(outHasTable[i].begin(), outHasTable[i].end());
            outHasTable[i].erase(unique(outHasTable[i].begin(), outHasTable[i].end()), outHasTable[i].end());
        }
        
        for (int i = 0; i < dimCoordinate; ++i) {
             cooDivideLength[i] = max(1, (int)ceil(outHasTable[i].size()*1.0 / cooDivideNum[i] / A._cooLimitLength[i])) * A._cooLimitLength[i];
        }
        for (int i = 0; i < dimCoordinate; ++i) {
            cooDivideNum[i] = (outHasTable[i].size() + cooDivideLength[i] - 1) / cooDivideLength[i];
        }

        for(int i = 0; i < dimCoordinate; ++i) {
            int id = cooDivideLength[i] - 1;
            
            int siz = outHasTable[i].size() - 1;
            for(int j = 0; j < cooDivideNum[i]; ++j) {
                // printf("%d ", id);
                query[i][j] = outHasTable[i][id];
                id = min(id + cooDivideLength[i], siz);
            }
            // printf("\n");
        }

        int tmp = 1;
        for (int i = 0; i < dimCoordinate; ++i) {
            tmp *= cooDivideNum[i];
        }
        int tmp2 = dimInner;
        tableSize = tmp * tmp2;
        // if(tableSize == 0) exit(0);
        for (int i = 0; i < tableSize; ++i) {
            sumTable[i] = 0;
        }    
        // print();
        // for(int i = 1; i < NUMDIMS; ++i) {
        //     assert(satOut[0].size() == satOut[i].size());
        // }
        for(int j = 0; j < (int)satOut[0].size(); ++j) {
            insertTimes ++;
            int tmp = 0;
            for(int i = 0; i < NUMDIMS; ++i) {
                int id = lower_bound(query[i], query[i] + cooDivideNum[i], satOut[i][j]) - query[i];
                // id /= cooDivideLength[i];
                tmp = (i ? cooDivideNum[i] : 1) * tmp + id;
            }
            tmp *= dimInner;
            for (int i = 0; i < dimInner; ++i) {
                // assert(tmp+i < tableSize);
                sumTable[tmp + i] += satInn[i][j];
            }
        }
        // printf("%d\n\n", tableSize);
        // for(int i = 0; i < NUMDIMS; ++i) {
        //     vector<ELEMTYPE>().swap(satOut[i]);
        // }
        // for(int i = 0; i < INNDIMS; ++i) {
        //     vector<INNTYPE>().swap(satInn[i]);
        // }
        // for(int i = 0; i < NUMDIMS; ++i) {
        //     vector<ELEMTYPE>().swap(outHasTable[i]);
        // }
        
        return tableSize;   
        
    }
    int copy(satStruct& A) {
        // printf("hhhh\n");
        insertTimes = 0;
        sumTable = A._sumTable;
        dimCoordinate = A._dimCoordinate;
        dimInner = A._dimInner;
        useHash = false;
        for (int i = 0; i < dimCoordinate; ++i) cooDivideNum[i] = A._cooDivideNum[i];
        for (int i = 0; i < dimCoordinate; ++i) {
            domain_min[i] = A._domain_min[i] - (A._useExpand ? (A._domain_max[i] - A._domain_min[i]) / 1000 : 0);
            domain_max[i] = A._domain_max[i] + (A._useExpand ? (A._domain_max[i] - A._domain_min[i]) / 1000 : 0);
        }
        
        for (int i = 0; i < dimCoordinate; ++i) {
            cooDivideLength[i] = max(1, (int)ceil( (domain_max[i] - domain_min[i] + 1)*1.0 / cooDivideNum[i] / A._cooLimitLength[i])) * A._cooLimitLength[i];
            int tt = lower_bound(bestDivideLength, bestDivideLength + 98, cooDivideLength[i]) - bestDivideLength;
            cooDivideLength[i] = bestDivideLength[tt];
        }

        for (int i = 0; i < dimCoordinate; ++i) {
            domain_min[i] = A._domain_min[i] - (A._domain_min[i] - A._allDomain_min[i]) % cooDivideLength[i];
            cooDivideNum[i] = (domain_max[i] - domain_min[i] + cooDivideLength[i]) / cooDivideLength[i];
            domain_max[i] = domain_min[i] + cooDivideLength[i] * cooDivideNum[i] - 1;
        }

        int tmp = 1;
        for (int i = 0; i < dimCoordinate; ++i) {
            // printf("%d ", cooDivideNum[i]);
            tmp *= cooDivideNum[i];
        }
        int tmp2 = dimInner;
        tableSize = tmp * tmp2;
        // if(tableSize == 0) exit(0);
        for (int i = 0; i < tableSize; ++i) {
            sumTable[i] = 0;
        }    
        // exit(0);
        // print();
        // printf("hhh %d\n", tableSize);
        return tableSize;   
        
    }

    void insertToTable(const ELEMTYPE* corDataNode, const INNTYPE* innerDataNode) { update(corDataNode, innerDataNode); }
    void insertToHashTable(const ELEMTYPE* corDataNode, const INNTYPE* innerDataNode) { updateHash(corDataNode, innerDataNode); }
    void insertToVector(const ELEMTYPE* corDataNode, const INNTYPE* innerDataNode) {
        for(int i = 0; i < NUMDIMS; ++i) {
            satOut[i].push_back(corDataNode[i]);
        }
        for(int i = 0; i < INNDIMS; ++i) {
            satInn[i].push_back(innerDataNode[i]);
        }
    }
    // void generateSat() {
    //     // printf("tableSize: %d\n", tableSize);
    //     int tmpCnt[NUMDIMS];
    //     int tranverse[NUMDIMS + 1];
    //     for (int i = 0; i <= dimCoordinate; ++i) tranverse[i] = 0;
    //     while (tranverse[dimCoordinate] != 1) {
    //         for(int i = 0; i < dimCoordinate; ++i) {
    //             assert(tranverse[i] < cooDivideNum[i]);
    //         }
    //         for (int l = 0; l < dimInner; ++l) {
    //             INNTYPE all = 0;
    //             for (int j = 0; j < (1 << dimCoordinate) - 1; ++j) {
    //                 bool flag = true;
    //                 bool Positive = false;
    //                 for (int z = 0; z < dimCoordinate && flag; ++z) {
    //                     tmpCnt[z] = tranverse[z];
    //                     if (((j >> z) & 1) == 0) {
    //                         tmpCnt[z]--;
    //                         Positive ^= 1;
    //                     }
    //                     if (tmpCnt[z] < 0) flag = false;
    //                 }
    //                 if (flag) {
    //                     all += Positive ? sumTable[getId(tmpCnt) + l] : -sumTable[getId(tmpCnt) + l];
    //                 }
    //             }
    //             sumTable[getId(tranverse) + l] += all;
    //         }
    //         tranverse[0] += 1;
    //         int id = 0;
    //         while (id < dimCoordinate && tranverse[id] == cooDivideNum[id] ) {
    //             tranverse[id] = 0;
    //             tranverse[id + 1] += 1;
    //             id++;
    //         }
    //     }
    // }
    void generateSat() {
        // int (*templateTable)[2] = new int[tableSize][2];
        // int flag = 0;
        // for(int i = 0; i < tableSize; ++i) {
        //     templateTable[i][flag] = sumTable[i];
        // }
        int Mul[NUMDIMS + 1];
        Mul[NUMDIMS] = 1;
        for(int i = NUMDIMS - 1; i >= 0; --i) {
            Mul[i] = Mul[i + 1] * cooDivideNum[i];
        }
        for(int i = NUMDIMS - 1; i >= 0; --i) {
            for(int z = 0; z < tableSize; ++z) {
                int tag = (z % Mul[i]) / Mul[i + 1];
                sumTable[z] += tag ? sumTable[z - Mul[i + 1]] : 0;
            }
            // flag ^= 1;
        }

        // for(int i = 0; i < tableSize; ++i) {
        //     sumTable[i] = templateTable[i][flag];
        // }
        // delete[] templateTable;
    }

    void calulate(ELEMTYPE* ask1, ELEMTYPE* ask2, int* allResult) {
        fflush(stdout);
        int minEdge[NUMDIMS];
        int maxEdge[NUMDIMS];
        int tmpCnt[NUMDIMS];

        bool suc = true;
        // for(int i = 0; i < tableSize; ++i) printf("%d ", sumTable[i]); printf("\n");
        // for(int i = 0; i < dimCoordinate; ++i) printf("%d %d | ", domain_min[i], domain_max[i]); printf("\n");
        for (int i = 0; i < dimCoordinate; ++i) {
            if(ask1[i] > domain_max[i] || ask2[i] < domain_min[i]) {
                suc = false;
                // printf("we don't have this point!\n");
                return;
            }
            assert(ask1[i] <= ask2[i]);
            if(useHash) {
                // ask1[i] = max(ask1[i], domain_min[i]);
                // ask2[i] = min(ask2[i], domain_max[i]);
                int posMin = lower_bound(query[i], query[i] + cooDivideNum[i], max(ask1[i], domain_min[i]) ) - query[i];
                int posMax = lower_bound(query[i], query[i] + cooDivideNum[i], min(ask2[i], domain_max[i]) ) - query[i];
                minEdge[i] = posMin - 1;
                maxEdge[i] = min(cooDivideNum[i] - 1, posMax);

                // if(useTag) {
                //     if(minEdge[i] == -1) minEdge[i] ++;
                //     if(maxEdge[i] == cooDivideNum[i] - 1) maxEdge[i] --;
                // }

                // printf("%d %d %d %d %d | %d %d | %d %d\n", ask1[i], ask2[i], posMin, posMax, cooDivideNum[i], domain_min[i], domain_max[i], minEdge[i], maxEdge[i]);
            } else {
                minEdge[i] = (int)ceil( (max(ask1[i], domain_min[i]) - domain_min[i])*1.0 / cooDivideLength[i] ) - 1;
                maxEdge[i] = min(cooDivideNum[i] - 1, (int)floor( (min(ask2[i], domain_max[i]) - domain_min[i])*1.0 / cooDivideLength[i] ));
            }

            assert((minEdge[i] >= -1) && (minEdge[i] <= (cooDivideNum[i] - 1) ));
            assert((maxEdge[i] >= -1) && (maxEdge[i] <= (cooDivideNum[i] - 1) ));
        }

        // for(int i = 0; i < NUMDIMS; ++i) {
        //     if(cooDivideNum[i] < outHasTable[i].size()) {
        //         printf("%d %d %d %d\n", i, cooDivideNum[i], cooDivideLength[i], outHasTable[i].size());
        //     }
        // }

        for (int l = 0; l < dimInner && suc; ++l) {
            int all = 0;
            for (int j = 0; j < (1 << dimCoordinate); ++j) {
                bool Positive = true;
                bool flag = true;
                for (int z = 0; z < dimCoordinate && flag; ++z) {
                    if ((j >> z) & 1) {
                        tmpCnt[z] = maxEdge[z];
                    } else {
                        Positive ^= 1;
                        tmpCnt[z] = minEdge[z];
                    }
                    flag = (tmpCnt[z] >= 0);
                }
                all += (Positive ? 1 : -1) * getId(tmpCnt, l);
            }
            allResult[l] += all;
        //    printf("%d ", all);
        }
    //    printf(" %d\n", insertTimes);
        // printf("\n\n");
    }
    
    void calulateDifference(ELEMTYPE* ask1, ELEMTYPE* ask2, int* allResult) {
        float minEdge[NUMDIMS];
        float maxEdge[NUMDIMS];
        float tmpCnt[NUMDIMS];
        int choose[NUMDIMS];

        bool suc = true;
        for (int i = 0; i < dimCoordinate; ++i) {
            if(ask1[i] > domain_max[i] || ask2[i] < domain_min[i]) {
                suc = false;
                break;
            }
            // assert(ask1[i] <= ask2[i]);

            if(useHash) {
                // it is a false sentence!
                int Ask1 = max(ask1[i], domain_min[i]);
                int Ask2 = min(ask2[i], domain_max[i]);
                
                int posMin = lower_bound(query[i], query[i] + cooDivideNum[i], Ask1) - query[i];
                int posMax = lower_bound(query[i], query[i] + cooDivideNum[i], Ask2) - query[i];
                int t1 = (posMin == 0) ? domain_min[i] : query[i][posMin - 1];
                int t2 = (posMax == 0) ? domain_min[i] : query[i][posMax - 1];
                int tt1 = query[i][posMin] - Ask1;
                int tt2 = query[i][posMax] - Ask2;
                if(query[i][posMin] == t1) tt1 = 0;
                if(query[i][posMax] == t2) tt2 = 0;
                minEdge[i] = max(-1.0, posMin - ( tt1 ?  tt1*1.0 / (query[i][posMin] - t1) : 0.0) - 1);
                maxEdge[i] = min(1.0*(cooDivideNum[i] - 1), posMax - ( tt2 ? tt2*1.0 / (query[i][posMax] - t2) : 0.0 ) );
                // maxEdge[i] = posMax - (query[i][posMax] - ask2[i]) / (query[i][posMax] - t2 + 1e-8);
                // printf("%d\n", posMax);
            } else {
                minEdge[i] = max(-1.0, (max(ask1[i], domain_min[i]) - domain_min[i]) * 1.0 / cooDivideLength[i] - 1);
                maxEdge[i] = min(1.0*(cooDivideNum[i] - 1), (min(ask2[i], domain_max[i]) - domain_min[i]) * 1.0 / cooDivideLength[i]);
            }
             
            // assert((minEdge[i] >= -1) && (minEdge[i] <= (cooDivideNum[i] - 1) ));
            // assert((maxEdge[i] >= -1) && (maxEdge[i] <= (cooDivideNum[i] - 1) ));
        }
        // for(int i = 0; i < NUMDIMS; ++i) printf("%.3f %.3f %d %d %d %d %d| ", minEdge[i], maxEdge[i], cooDivideNum[i], ask1[i], ask2[i], domain_min[i], domain_max[i]); printf("\n"); exit(0);
        
        for (int l = 0; l < dimInner && suc; ++l) {
            int all = 0;
            for (int j = 0; j < (1 << dimCoordinate); ++j) {
                bool Positive = true;
                bool flag = true;
                for (int z = 0; z < dimCoordinate && flag; ++z) {
                    if ((j >> z) & 1) {
                        tmpCnt[z] = maxEdge[z];
                    } else {
                        Positive ^= 1;
                        tmpCnt[z] = minEdge[z];
                    }
                }
                all += (Positive ? 1 : -1) * Difference(choose, tmpCnt, l, 0);
            }
            allResult[l] += all;
        }
    }
};

#endif