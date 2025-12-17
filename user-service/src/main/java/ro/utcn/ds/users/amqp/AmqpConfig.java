package ro.utcn.ds.users.amqp;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;

@Configuration
public class AmqpConfig {
    public static final String SYNC_EXCHANGE = "ems.sync";
    public static final String DEVICE_SYNC_QUEUE = "device.sync";

    @Bean
    TopicExchange syncExchange() {
        return new TopicExchange(SYNC_EXCHANGE, true, false);
    }

    @Bean
    MessageConverter messageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    // Ensure the queue/binding for user.deleted exists even if device-service is down
    @Bean
    Queue deviceSyncQueue() {
        return QueueBuilder.durable(DEVICE_SYNC_QUEUE).build();
    }

    @Bean
    Declarables deviceSyncBinding(Queue deviceSyncQueue, TopicExchange syncExchange) {
        Binding userDeleted = BindingBuilder.bind(deviceSyncQueue)
                .to(syncExchange)
                .with("user.deleted");
        return new Declarables(userDeleted);
    }
}
