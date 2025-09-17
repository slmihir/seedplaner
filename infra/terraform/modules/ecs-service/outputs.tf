# Outputs for ECS Service Module

output "service_id" {
  description = "ID of the ECS service"
  value       = aws_ecs_service.main.id
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.main.id
}

output "service_cluster" {
  description = "Cluster of the ECS service"
  value       = aws_ecs_service.main.cluster
}

output "service_desired_count" {
  description = "Desired count of the ECS service"
  value       = aws_ecs_service.main.desired_count
}

output "service_running_count" {
  description = "Running count of the ECS service"
  value       = aws_ecs_service.main.running_count
}

output "service_pending_count" {
  description = "Pending count of the ECS service"
  value       = aws_ecs_service.main.pending_count
}

output "autoscaling_target_arn" {
  description = "ARN of the autoscaling target"
  value       = var.enable_autoscaling ? aws_appautoscaling_target.ecs_target[0].arn : null
}

output "autoscaling_target_resource_id" {
  description = "Resource ID of the autoscaling target"
  value       = var.enable_autoscaling ? aws_appautoscaling_target.ecs_target[0].resource_id : null
}

output "cpu_scaling_policy_arn" {
  description = "ARN of the CPU scaling policy"
  value       = var.enable_autoscaling ? aws_appautoscaling_policy.ecs_policy_cpu[0].arn : null
}

output "memory_scaling_policy_arn" {
  description = "ARN of the memory scaling policy"
  value       = var.enable_autoscaling ? aws_appautoscaling_policy.ecs_policy_memory[0].arn : null
}

output "high_cpu_alarm_arn" {
  description = "ARN of the high CPU alarm"
  value       = var.enable_monitoring ? aws_cloudwatch_metric_alarm.high_cpu[0].arn : null
}

output "high_memory_alarm_arn" {
  description = "ARN of the high memory alarm"
  value       = var.enable_monitoring ? aws_cloudwatch_metric_alarm.high_memory[0].arn : null
}

