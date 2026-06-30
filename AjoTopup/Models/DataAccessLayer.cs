using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;

namespace AjoTopup.Models
{
    public class DataAccessLayer : BaseSqlServer
    {
        sqlResult sqlRes = new sqlResult();

        public DataAccessLayer(string con = "")
        {
            if(con != "")
                sqlRes = new sqlResult(con); 
        }

        public gridResults getDataGrid(string table, Dictionary<string, object> grdParam, string sql = "", string trx = "")
        {
            if (table != "" && sql == "")
            {
                sql = string.Format("select * from {0} a where 1=1 ", table);
            }
            if (grdParam.ContainsKey("filterRules"))
            {
                if (grdParam["filterRules"] != null)
                {
                    JavaScriptSerializer serialize = new JavaScriptSerializer();
                    List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(grdParam["filterRules"].ToString());
                    List<Dictionary<string, object>> sqlFilter = new List<Dictionary<string, object>>();
                    foreach (var dicFilter in lstFilter)
                    {

                        var strField = dicFilter["field"].ToString();
                        if (strField == "provider" && trx == "listproduk")
                        {
                            dicFilter["field"] = "o.nama";
                        }
                        if (trx == "trx")
                        {

                            if (strField == "nama_produk")
                                dicFilter["field"] = "p.nama";

                            if (strField == "nama_reseller")
                                dicFilter["field"] = "c.nama";

                            if (strField == "nama_modul")
                                dicFilter["field"] = "m.label";

                        }
                        else if (trx == "listproduk")
                        {
                            if (strField == "kode")
                                dicFilter["field"] = "a.kode";
                            if (strField == "nama")
                                dicFilter["field"] = "a.nama";
                        }
                        else
                        {
                            dicFilter["field"] = dicFilter["field"];
                        }


                        sqlFilter.Add(dicFilter);
                    }
                    grdParam["filterRules"] = serialize.Serialize(sqlFilter);
                }

            }

            if (grdParam.ContainsKey("filterCustom"))
            {
                if (grdParam["filterCustom"] != null)
                {
                    JavaScriptSerializer serialize = new JavaScriptSerializer();
                    List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(grdParam["filterCustom"].ToString());
                    List<Dictionary<string, object>> sqlFilter = new List<Dictionary<string, object>>();
                    foreach (var dicFilter in lstFilter)
                    {
                        switch (dicFilter["field"].ToString())
                        {

                            default:
                                dicFilter["field"] = "a." + dicFilter["field"];
                                break;
                        }

                        sqlFilter.Add(dicFilter);
                    }
                    grdParam["filterCustom"] = serialize.Serialize(sqlFilter);
                }
            }


            return sqlRes.getDataGrid(grdParam, sql);
        }



        public gridResults getData(string table, Dictionary<string, object> grdParam, string sql = "", string trx = "")
        {
            if (table != "" && sql == "")
            {
                sql = string.Format("select * from {0} a where 1=1 ", table);
            }
            if (grdParam.ContainsKey("filterRules"))
            {
                if (grdParam["filterRules"] != null)
                {
                    JavaScriptSerializer serialize = new JavaScriptSerializer();
                    List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(grdParam["filterRules"].ToString());
                    List<Dictionary<string, object>> sqlFilter = new List<Dictionary<string, object>>();
                    foreach (var dicFilter in lstFilter)
                    {

                        var strField = dicFilter["field"].ToString();
                        if (strField == "provider" && trx == "listproduk")
                        {
                            dicFilter["field"] = "o.nama";
                        }
                        if (trx == "trx")
                        {

                            if (strField == "nama_produk")
                                dicFilter["field"] = "p.nama";

                            if (strField == "nama_reseller")
                                dicFilter["field"] = "c.nama";

                            if (strField == "nama_modul")
                                dicFilter["field"] = "m.label";

                        }
                        else
                        {
                            dicFilter["field"] = dicFilter["field"];
                        }


                        sqlFilter.Add(dicFilter);
                    }
                    grdParam["filterRules"] = serialize.Serialize(sqlFilter);
                }

            }

            if (grdParam.ContainsKey("filterCustom"))
            {
                if (grdParam["filterCustom"] != null)
                {
                    JavaScriptSerializer serialize = new JavaScriptSerializer();
                    List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(grdParam["filterCustom"].ToString());
                    List<Dictionary<string, object>> sqlFilter = new List<Dictionary<string, object>>();
                    foreach (var dicFilter in lstFilter)
                    {
                        switch (dicFilter["field"].ToString())
                        {

                            default:
                                dicFilter["field"] = "a." + dicFilter["field"];
                                break;
                        }

                        sqlFilter.Add(dicFilter);
                    }
                    grdParam["filterCustom"] = serialize.Serialize(sqlFilter);
                }
            }


            return sqlRes.getDataGrid(grdParam, sql);
        }

        public returnResult execSQL(string sql)
        {
            return sqlRes.execSql(sql);
        }

        public returnResult execSqlNoTrx(string sql)
        {
            return sqlRes.execSqlNoTrx(sql);
        }


        public Dictionary<string, object> getDataRow(string sql, string trx = "")
        {
            return sqlRes.getDataRow(sql);
        }

        public gridResults getDataGridPromt(string table = "", string col = "", Dictionary<string, object> grdParam = null, Dictionary<string, object> filterParam = null, string sql = "", string trx = "")
        {

            if (table != "" && sql == "")
            {
                sql = string.Format("select {1} from {0} a ", table, col);
            }

            if (filterParam != null)
            {
                string strFilter = " where 1=1";
                foreach (var filter in filterParam)
                {
                    strFilter += " and " + filter.Key + "='" + filter.Value + "'";
                }
                sql += strFilter;
            }

            if (grdParam.ContainsKey("filterRules"))
            {
                if (grdParam["filterRules"] != null)
                {
                    JavaScriptSerializer serialize = new JavaScriptSerializer();
                    List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(grdParam["filterRules"].ToString());
                    List<Dictionary<string, object>> sqlFilter = new List<Dictionary<string, object>>();
                    foreach (var dicFilter in lstFilter)
                    {
                        var strField = dicFilter["field"].ToString();
                        if (strField == "nama_modul")
                        {
                            dicFilter["field"] = "m.label";
                        }
                        if (trx == "")
                        {
                        }
                        else
                        {
                            dicFilter["field"] = dicFilter["field"];
                        }

                        sqlFilter.Add(dicFilter);
                    }
                    grdParam["filterRules"] = serialize.Serialize(sqlFilter);
                }
            }

            return sqlRes.getDataGrid(grdParam, sql);
        }

        public List<Dictionary<string, object>> getDataList(string tbl = "", string col = "")
        {
            string sql = string.Format("select {0} from {1}", col, tbl);
            return sqlRes.getDataList(sql);
        }

        public List<Dictionary<string, object>> getDataList(string sql = "")
        {
            return sqlRes.getDataList(sql);
        }



        public object getData(string sql)
        {
            DataTable sqlData = sqlRes.getExecuteQuery(sql);
            if (sqlData.Rows.Count > 0)
            {
                return sqlData.Rows[0][0];
            }
            else
            {
                return "";
            }
        }


        public returnResult deleteData(string tbl, string filter, Dictionary<string, object> filterValue = null)
        {
            return sqlRes.deleteData(tbl, filter, filterValue);

        }
        public returnResult saveData(string tbl, string mode, Dictionary<string, object> data, string filter, Dictionary<string, object> filterValue = null, bool audit = true)
        {
            returnResult res = new returnResult();
            if (mode == "add")
            {
                res = sqlRes.insertData(tbl, data, audit);
            }
            else if (mode == "edit")
            {
                res = sqlRes.updateData(tbl, data, filter, filterValue, audit);
            }

            return res;
        }
    }
}
