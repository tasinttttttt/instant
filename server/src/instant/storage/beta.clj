(ns instant.storage.beta
  (:require [instant.config :as config]
            [instant.db.datalog :as d]
            [instant.db.model.attr :as attr-model]
            [instant.util.tracer :as tracer]
            [instant.jdbc.aurora :as aurora]))

(def whitelist-ns "storage-whitelist")

(defn whitelist []
  (try
    (if-let [config-app-id (config/instant-config-app-id)]
      (let [attrs (attr-model/get-by-app-id aurora/conn-pool config-app-id)
            get-attr-id (fn [prop]
                          (:id (attr-model/seek-by-fwd-ident-name [whitelist-ns prop]
                                                                  attrs)))
            patterns [[:ea '?e (get-attr-id "isEnabled") true]
                      [:ea '?e (get-attr-id "appId") '?appId]]
            query-result (d/query {:app-id config-app-id
                                   :db {:conn-pool aurora/conn-pool}}
                                  patterns)
            value (get-in query-result [:symbol-values '?appId])]
        value)
      #{})
    (catch Exception e
      (tracer/record-exception-span! e {:name "storage/whitelist-error"})
      #{})))

(defn assert-storage-enabled! []
  true)
