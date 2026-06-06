{{/*
Common labels
*/}}
{{- define "collabdocs.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Secret name
*/}}
{{- define "collabdocs.secretName" -}}
{{ .Release.Name }}-secrets
{{- end }}

{{/*
ConfigMap name
*/}}
{{- define "collabdocs.configMapName" -}}
{{ .Release.Name }}-config
{{- end }}

{{/*
In-cluster postgres hostname
*/}}
{{- define "collabdocs.postgresHost" -}}
{{ .Release.Name }}-postgres
{{- end }}

{{/*
Database URL — explicit override wins; otherwise auto-built from postgres values.
*/}}
{{- define "collabdocs.databaseUrl" -}}
{{- if .Values.secrets.databaseUrl -}}
{{- .Values.secrets.databaseUrl -}}
{{- else -}}
{{- printf "postgres://%s:%s@%s:%v/%s?sslmode=disable" .Values.postgres.username .Values.postgres.password (include "collabdocs.postgresHost" .) .Values.postgres.port .Values.postgres.database -}}
{{- end -}}
{{- end }}
